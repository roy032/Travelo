import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FavoritesContext } from "./favorites-context";
import { useAuth } from "../hooks/useAuth";
import { favoriteApi } from "../services/api.service";

const emptyIds = () => ({ destination: new Set(), trip: new Set() });
const NO_IDS = emptyIds();

/**
 * Loads the IDs of the signed-in user's saved destinations and trips once,
 * so every card can show whether it is saved without its own request.
 */
export const FavoritesProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [loadedIds, setIds] = useState(emptyIds);
  // Signed-out users have nothing saved; don't show the last user's favorites
  const ids = isAuthenticated ? loadedIds : NO_IDS;
  // Keys ("trip:<id>") of items whose save/unsave request is in flight
  const [pending, setPending] = useState(() => new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }
    let cancelled = false;

    favoriteApi
      .getFavoriteIds()
      .then((data) => {
        if (!cancelled) {
          setIds({
            destination: new Set(data.destination || []),
            trip: new Set(data.trip || []),
          });
        }
      })
      .catch(() => {
        // The error was already shown by the API layer
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const isFavorite = useCallback(
    (itemType, itemId) => Boolean(ids[itemType]?.has(String(itemId))),
    [ids]
  );

  const isPending = useCallback(
    (itemType, itemId) => pending.has(`${itemType}:${itemId}`),
    [pending]
  );

  const setSaved = (itemType, itemId, saved) => {
    setIds((prev) => {
      const next = new Set(prev[itemType]);
      if (saved) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return { ...prev, [itemType]: next };
    });
  };

  const toggleFavorite = useCallback(
    async (itemType, rawId) => {
      const itemId = String(rawId);
      const key = `${itemType}:${itemId}`;
      const wasSaved = ids[itemType]?.has(itemId);

      setPending((prev) => new Set(prev).add(key));
      // Update right away and roll back if the request fails
      setSaved(itemType, itemId, !wasSaved);

      try {
        if (wasSaved) {
          await favoriteApi.removeFavorite(itemType, itemId);
          toast.success("Removed from saved");
        } else {
          await favoriteApi.addFavorite(itemType, itemId);
          toast.success("Saved");
        }
        return !wasSaved;
      } catch {
        setSaved(itemType, itemId, wasSaved);
        return wasSaved;
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [ids]
  );

  const value = useMemo(
    () => ({
      isFavorite,
      isPending,
      toggleFavorite,
      savedCount: ids.destination.size + ids.trip.size,
    }),
    [isFavorite, isPending, toggleFavorite, ids]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
