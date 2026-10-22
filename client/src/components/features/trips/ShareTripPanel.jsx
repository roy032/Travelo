import { useState } from "react";
import PropTypes from "prop-types";
import { Check, Copy, Globe, Link2Off, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../ui/Button";
import { tripApi } from "../../../services/api.service";

const shareUrlFor = (token) => `${window.location.origin}/share/${token}`;

/**
 * Turn a trip's public read-only link on or off and copy or share it.
 * Only the owner can change the link; other members can copy it once it is on.
 */
const ShareTripPanel = ({ trip, isOwner, onShareTokenChange }) => {
  const tripId = trip.id || trip._id;
  const token = trip.shareToken;
  const shareUrl = token ? shareUrlFor(token) : "";
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const turnOn = async () => {
    setBusy(true);
    try {
      const { shareToken } = await tripApi.enableSharing(tripId);
      onShareTokenChange(shareToken);
      toast.success("Public link created");
    } catch {
      // handleApiError already showed the reason
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      await tripApi.disableSharing(tripId);
      onShareTokenChange(null);
      setCopied(false);
      toast.success("Public link turned off");
    } catch {
      // handleApiError already showed the reason
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy. Select the link and copy it instead");
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: trip.title, url: shareUrl });
    } catch {
      // Closing the share sheet rejects; nothing to do
    }
  };

  if (!token) {
    return (
      <div className='space-y-4'>
        <p className='text-gray-700 dark:text-gray-300'>
          Anyone with a public link can see this trip&apos;s dates, itinerary
          and map, without signing in. They won&apos;t see members, chat,
          expenses, notes, photos or documents.
        </p>
        {isOwner ? (
          <Button
            onClick={turnOn}
            disabled={busy}
            className='flex items-center'
          >
            <Globe size={16} className='mr-2' aria-hidden='true' />
            {busy ? "Creating link..." : "Create public link"}
          </Button>
        ) : (
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Only the trip organizer can create a public link.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <p className='text-gray-700 dark:text-gray-300'>
        Anyone with this link can see the trip plan and add it to their
        calendar. Members, chat, expenses, notes, photos and documents stay
        private.
      </p>

      <div className='flex flex-col sm:flex-row gap-2'>
        <label htmlFor='share-link' className='sr-only'>
          Public link
        </label>
        <input
          id='share-link'
          type='text'
          readOnly
          value={shareUrl}
          onFocus={(e) => e.target.select()}
          className='flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-200'
        />
        <Button
          variant='outline'
          onClick={copy}
          className='flex items-center justify-center'
        >
          {copied ? (
            <Check size={16} className='mr-2' aria-hidden='true' />
          ) : (
            <Copy size={16} className='mr-2' aria-hidden='true' />
          )}
          {copied ? "Copied" : "Copy link"}
        </Button>
        {typeof navigator.share === "function" && (
          <Button
            variant='outline'
            onClick={share}
            className='flex items-center justify-center'
          >
            <Share2 size={16} className='mr-2' aria-hidden='true' />
            Share
          </Button>
        )}
      </div>

      {isOwner && (
        <div className='pt-4 border-t border-gray-200 dark:border-gray-700'>
          <Button
            variant='outline'
            onClick={turnOff}
            disabled={busy}
            className='flex items-center text-red-600 dark:text-red-400'
          >
            <Link2Off size={16} className='mr-2' aria-hidden='true' />
            {busy ? "Turning off..." : "Turn off public link"}
          </Button>
          <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
            The link stops working at once. If you share again later, you get a
            new link.
          </p>
        </div>
      )}
    </div>
  );
};

ShareTripPanel.propTypes = {
  trip: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    title: PropTypes.string.isRequired,
    shareToken: PropTypes.string,
  }).isRequired,
  isOwner: PropTypes.bool.isRequired,
  onShareTokenChange: PropTypes.func.isRequired,
};

export default ShareTripPanel;
