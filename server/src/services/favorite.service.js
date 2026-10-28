import Favorite from '#models/favorite.model.js';
import Destination from '#models/destination.model.js';
import Trip from '#models/trip.model.js';
import { NotFoundError } from '#errors/AppError.js';

const findItem = async (itemType, itemId) => {
  if (itemType === 'destination') {
    return Destination.exists({ _id: itemId });
  }
  return Trip.exists({ _id: itemId, isDeleted: false });
};

/**
 * Save a destination or trip to the user's favorites. Saving twice is a no-op.
 * @param {string} userId - User ID
 * @param {string} itemType - destination or trip
 * @param {string} itemId - ID of the destination or trip
 * @returns {Promise<{created: boolean}>}
 */
export const addFavorite = async (userId, itemType, itemId) => {
  if (!(await findItem(itemType, itemId))) {
    throw new NotFoundError(
      itemType === 'destination' ? 'Destination not found' : 'Trip not found'
    );
  }

  const result = await Favorite.updateOne(
    { user: userId, itemType, item: itemId },
    { $setOnInsert: { user: userId, itemType, item: itemId } },
    { upsert: true }
  );

  return { created: result.upsertedCount > 0 };
};

/**
 * Remove an item from the user's favorites. Removing a missing one is a no-op.
 * @param {string} userId - User ID
 * @param {string} itemType - destination or trip
 * @param {string} itemId - ID of the destination or trip
 * @returns {Promise<{removed: boolean}>}
 */
export const removeFavorite = async (userId, itemType, itemId) => {
  const result = await Favorite.deleteOne({ user: userId, itemType, item: itemId });
  return { removed: result.deletedCount > 0 };
};

/**
 * Get the IDs of everything the user has saved, grouped by type.
 * Cheap enough to load once so cards can show a filled heart.
 * @param {string} userId - User ID
 * @returns {Promise<{destination: string[], trip: string[]}>}
 */
export const getFavoriteIds = async (userId) => {
  const favorites = await Favorite.find({ user: userId }).select('itemType item').lean();
  const ids = { destination: [], trip: [] };
  for (const favorite of favorites) {
    ids[favorite.itemType].push(favorite.item.toString());
  }
  return ids;
};

/**
 * Get the user's saved destinations and trips with their details, newest first.
 * Items that were deleted since they were saved are left out.
 * @param {string} userId - User ID
 * @param {string} [itemType] - Only return this type
 * @returns {Promise<{destinations: Array, trips: Array}>}
 */
export const getFavorites = async (userId, itemType) => {
  const query = { user: userId };
  if (itemType) {
    query.itemType = itemType;
  }
  const favorites = await Favorite.find(query).sort({ createdAt: -1 }).lean();

  const idsOf = (type) =>
    favorites.filter((f) => f.itemType === type).map((f) => f.item);

  const [destinations, trips] = await Promise.all([
    Destination.find({ _id: { $in: idsOf('destination') } }).lean(),
    Trip.find({ _id: { $in: idsOf('trip') }, isDeleted: false })
      .select(
        'title description startDate endDate destinationType tripCategory owner members'
      )
      .lean(),
  ]);

  const destinationsById = new Map(destinations.map((d) => [d._id.toString(), d]));
  const tripsById = new Map(trips.map((t) => [t._id.toString(), t]));
  const result = { destinations: [], trips: [] };

  for (const favorite of favorites) {
    const id = favorite.item.toString();
    if (favorite.itemType === 'destination' && destinationsById.has(id)) {
      const d = destinationsById.get(id);
      result.destinations.push({
        id,
        name: d.name,
        description: d.description,
        category: d.category,
        country: d.country,
        featuredImage: d.images?.find((img) => img.isFeatured) || d.images?.[0],
        ratingAverage: d.ratingAverage || 0,
        ratingCount: d.ratingCount || 0,
        savedAt: favorite.createdAt,
      });
    } else if (favorite.itemType === 'trip' && tripsById.has(id)) {
      const t = tripsById.get(id);
      result.trips.push({
        id,
        title: t.title,
        description: t.description,
        startDate: t.startDate,
        endDate: t.endDate,
        destinationType: t.destinationType,
        tripCategory: t.tripCategory,
        ownerId: t.owner.toString(),
        members: t.members.map((m) => m.toString()),
        memberCount: t.members.length,
        savedAt: favorite.createdAt,
      });
    }
  }

  return result;
};

