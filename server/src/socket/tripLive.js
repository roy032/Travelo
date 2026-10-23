import mongoose from "mongoose";
import Trip from "#models/trip.model.js";

// Live trip collaboration: members viewing a trip join its live room, see who
// else is viewing, and get a "tripChange" event whenever someone changes the
// trip so they can refetch that section. Events only name what changed; the
// data itself is always loaded through the authorized REST API.

let io = null;

export const liveRoom = (tripId) => `tripLive_${tripId}`;

const LIVE_ROOM_PREFIX = "tripLive_";

/**
 * Trip-scoped path segments (after /api/trips/:tripId/) and the section of
 * the trip page they change. Anything not listed (chat, reports, the AI plan
 * preview) does not notify.
 */
const RESOURCE_BY_SEGMENT = {
  "": "trip",
  share: "trip",
  activities: "activities",
  checklist: "checklist",
  "packing-suggestions": "checklist",
  notes: "notes",
  expenses: "expenses",
  photos: "photos",
  members: "members",
  "join-requests": "members",
  invitations: "members",
};

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Work out which trip and section a request changed from its path
 * (relative to /api), e.g. /trips/<id>/expenses/<expenseId> -> expenses
 * @param {string} path
 * @returns {{tripId: string, resource: string, action?: string} | null}
 */
export const resolveTripChange = (path) => {
  const match = path.match(/^\/trips\/([a-f0-9]{24})(?:\/([a-z-]+))?/i);
  if (!match) return null;
  const segment = match[2] ?? "";
  const resource = RESOURCE_BY_SEGMENT[segment];
  if (!resource) return null;
  // Turning sharing on or off updates the trip rather than creating/deleting it
  return segment === "share"
    ? { tripId: match[1], resource, action: "updated" }
    : { tripId: match[1], resource };
};

const ACTION_BY_METHOD = {
  POST: "created",
  PUT: "updated",
  PATCH: "updated",
  DELETE: "deleted",
};

/**
 * Tell everyone viewing a trip that part of it changed
 * @param {string} tripId
 * @param {{resource: string, action: string, actorId?: string}} change
 * @param {string} [exceptSocketId] - The socket that made the change already has it
 */
export const emitTripChange = (tripId, change, exceptSocketId) => {
  if (!io || !tripId) return;
  // Accept a populated trip document as well as an ID
  const id = String(tripId._id ?? tripId);
  const room = io.to(liveRoom(id));
  (exceptSocketId ? room.except(exceptSocketId) : room).emit("tripChange", {
    tripId: id,
    ...change,
    at: new Date().toISOString(),
  });
};

/**
 * Express middleware (mounted at /api) that broadcasts a tripChange after a
 * successful write. Controllers whose paths don't contain the trip ID set
 * res.locals.liveChange = { tripId, resource } instead.
 */
export const tripLiveUpdates = (req, res, next) => {
  if (!MUTATING_METHODS.has(req.method)) return next();

  // req.path is relative to the mount point here; routers change it later
  const fromPath = resolveTripChange(req.path);
  const header = req.get("x-socket-id");
  const socketId =
    typeof header === "string" && header.length <= 64 ? header : undefined;

  res.on("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return;
    const change = res.locals.liveChange ?? fromPath;
    if (!change?.tripId) return;
    emitTripChange(
      change.tripId,
      {
        resource: change.resource,
        action: change.action ?? ACTION_BY_METHOD[req.method],
        actorId: req.user?.id,
      },
      socketId
    );
  });

  next();
};

const isMember = (trip, userId) =>
  trip.owner.toString() === userId ||
  trip.members.some((m) => m.toString() === userId);

/**
 * Unique user IDs of everyone currently viewing the trip
 */
const viewersOf = async (tripId) => {
  const sockets = await io.in(liveRoom(tripId)).fetchSockets();
  return [...new Set(sockets.map((s) => s.data.userId).filter(Boolean))];
};

const broadcastPresence = async (tripId) => {
  try {
    io.to(liveRoom(tripId)).emit("tripPresence", {
      tripId,
      userIds: await viewersOf(tripId),
    });
  } catch (error) {
    console.error("Error broadcasting presence:", error);
  }
};

/**
 * Register the live-collaboration events for one connected socket
 * @param {import("socket.io").Socket} socket - Authenticated socket (socket.userId set)
 */
export const registerTripLiveHandlers = (socket) => {
  // fetchSockets only exposes socket.data, not custom properties
  socket.data.userId = socket.userId;

  socket.on("watchTrip", async (payload, ackArg) => {
    const callback = typeof ackArg === "function" ? ackArg : undefined;
    try {
      const tripId = payload?.tripId;
      if (typeof tripId !== "string" || !mongoose.isValidObjectId(tripId)) {
        return callback?.({ error: "Invalid trip ID" });
      }

      const trip = await Trip.findById(tripId).select("owner members isDeleted");
      if (!trip || trip.isDeleted) {
        return callback?.({ error: "Trip not found" });
      }
      if (!isMember(trip, socket.userId)) {
        return callback?.({ error: "You are not a member of this trip" });
      }

      socket.join(liveRoom(tripId));
      const userIds = await viewersOf(tripId);
      socket.to(liveRoom(tripId)).emit("tripPresence", { tripId, userIds });
      callback?.({ success: true, userIds });
    } catch (error) {
      console.error("Error watching trip:", error);
      callback?.({ error: "Failed to watch trip" });
    }
  });

  socket.on("unwatchTrip", async (payload, ackArg) => {
    const callback = typeof ackArg === "function" ? ackArg : undefined;
    const tripId = payload?.tripId;
    if (typeof tripId !== "string" || !socket.rooms.has(liveRoom(tripId))) {
      return callback?.({ success: true });
    }
    socket.leave(liveRoom(tripId));
    await broadcastPresence(tripId);
    callback?.({ success: true });
  });

  // Rooms are already empty by the time "disconnect" fires
  let watchedOnDisconnect = [];
  socket.on("disconnecting", () => {
    watchedOnDisconnect = [...socket.rooms]
      .filter((room) => room.startsWith(LIVE_ROOM_PREFIX))
      .map((room) => room.slice(LIVE_ROOM_PREFIX.length));
  });
  socket.on("disconnect", () => {
    for (const tripId of watchedOnDisconnect) broadcastPresence(tripId);
  });
};

/**
 * Remove a user from a trip's live room, e.g. after they leave the trip or
 * are removed by the owner
 */
export const removeFromTripLive = async (tripId, userId) => {
  if (!io) return;
  const room = liveRoom(String(tripId));
  const sockets = await io.in(room).fetchSockets();
  sockets
    .filter((s) => s.data.userId === String(userId))
    .forEach((s) => s.leave(room));
  await broadcastPresence(String(tripId));
};

/**
 * @param {import("socket.io").Server | null} server
 */
export const setTripLiveServer = (server) => {
  io = server;
};
