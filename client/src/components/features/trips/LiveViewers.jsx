import Avatar from "../../ui/Avatar";

const memberId = (member) => String(member?.id || member?._id || "");

/**
 * Shows which members are looking at the trip right now
 */
const LiveViewers = ({ viewerIds = [], members = [], currentUserId, isLive }) => {
  if (!isLive) return null;

  const others = viewerIds
    .filter((id) => id !== currentUserId)
    .map((id) => members.find((m) => memberId(m) === id) || { id, name: "" });
  const names = others.map((m) => m.name || "A member");

  const label =
    others.length === 0
      ? "Live: changes from other members appear here instantly"
      : `Also viewing: ${names.join(", ")}`;

  return (
    <div
      className='flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300'
      role='status'
      aria-live='polite'
    >
      <span className='relative flex h-2.5 w-2.5' aria-hidden='true'>
        <span className='absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 motion-safe:animate-ping' />
        <span className='relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500' />
      </span>
      {others.length > 0 && (
        <span className='flex -space-x-2' aria-hidden='true'>
          {others.slice(0, 5).map((member) => (
            <Avatar
              key={memberId(member)}
              src={member.avatar}
              name={member.name}
              size='sm'
              className='ring-2 ring-white dark:ring-gray-900'
            />
          ))}
        </span>
      )}
      <span>{label}</span>
    </div>
  );
};

export default LiveViewers;
