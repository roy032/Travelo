import { UserMinus, Crown } from "lucide-react";
import Avatar from "../../ui/Avatar";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";

/**
 * MemberCard component - displays individual member with remove button (owner only)
 */
const MemberCard = ({
  member,
  isOwner,
  isTripOwner,
  currentUserId,
  onRemove,
  removing,
}) => {
  const isSelf = member._id === currentUserId;
  const isMemberOwner = member._id === isOwner || member.isOwner;
  console.log(member);

  return (
    <div className='flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow'>
      <div className='flex items-center gap-3 flex-1'>
        <Avatar src={member.avatar} name={member.name} size='md' />
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2'>
            <p className='text-sm font-medium text-gray-900 truncate'>
              {member.name}
              {isSelf && <span className='text-gray-500'> (You)</span>}
            </p>
            {isMemberOwner && (
              <Badge variant='warning' className='flex items-center gap-1'>
                <Crown size={12} />
                Owner
              </Badge>
            )}
          </div>
          <p className='text-sm text-gray-500 truncate'>{member.email}</p>
        </div>
      </div>

      {/* Remove button - only show for trip owner, not for the owner themselves */}
      {isTripOwner && !isMemberOwner && (
        <Button
          variant='danger'
          size='sm'
          onClick={() => onRemove(member.id)}
          disabled={removing}
          loading={removing}
          className='flex items-center gap-1 ml-4'
        >
          <UserMinus size={16} />
          Remove
        </Button>
      )}
    </div>
  );
};

export default MemberCard;
