import PropTypes from "prop-types";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { useFavorites } from "../../hooks/useFavorites";

/**
 * Heart button that saves or unsaves a destination or trip.
 * Signed-out users are sent to the login page.
 */
const FavoriteButton = ({ itemType, itemId, label, className = "", size = "md" }) => {
  const { isAuthenticated } = useAuth();
  const { isFavorite, isPending, toggleFavorite } = useFavorites();
  const navigate = useNavigate();

  const saved = isFavorite(itemType, itemId);
  const busy = isPending(itemType, itemId);
  const iconSize = size === "sm" ? 18 : 22;
  const name = label ? ` ${label}` : "";

  const handleClick = (event) => {
    // Cards are often links; don't follow them when the heart is clicked
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Log in to save favorites");
      navigate("/login");
      return;
    }
    toggleFavorite(itemType, itemId);
  };

  return (
    <button
      type='button'
      onClick={handleClick}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? `Remove${name} from saved` : `Save${name}`}
      title={saved ? "Remove from saved" : "Save"}
      className={`inline-flex items-center justify-center rounded-full bg-white/95 shadow-md p-2 transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-60 ${className}`}
    >
      <Heart
        size={iconSize}
        aria-hidden='true'
        className={saved ? "fill-pink-500 text-pink-500" : "text-gray-600"}
      />
    </button>
  );
};

FavoriteButton.propTypes = {
  itemType: PropTypes.oneOf(["destination", "trip"]).isRequired,
  itemId: PropTypes.string.isRequired,
  label: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md"]),
};

export default FavoriteButton;
