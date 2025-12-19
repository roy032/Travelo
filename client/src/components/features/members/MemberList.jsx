import { useState } from "react";
import { Users, UserPlus } from "lucide-react";
import MemberCard from "./MemberCard";
import InviteMemberForm from "./InviteMemberForm";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";
import Loader from "../../ui/Loader";
import { tripApi, invitationApi } from "../../../services/api.service";
import toast from "react-hot-toast";

/**
 * MemberList component - displays all trip members with management controls
 */
const MemberList = ({
  tripId,
  members,
  ownerId,
  currentUserId,
  isTripOwner,
  onMembersUpdate,
}) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);

  const handleInvite = async (email) => {
    setInviting(true);
    try {
      await invitationApi.sendInvitation(tripId, email);
      setIsInviteModalOpen(false);

      // Refresh members list
      if (onMembersUpdate) {
        const data = await tripApi.getTripMembers(tripId);
        onMembersUpdate(data.members);
      }
    } catch (error) {
      console.error("Error inviting member:", error);
      // Error toast is handled by API service
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this member from the trip?"
      )
    ) {
      return;
    }

    setRemovingMemberId(memberId);
    try {
      await tripApi.removeMember(tripId, memberId);
      toast.success("Member removed successfully");

      // Refresh members list
      if (onMembersUpdate) {
        const data = await tripApi.getTripMembers(tripId);
        onMembersUpdate(data.members);
      }
    } catch (error) {
      console.error("Error removing member:", error);
      // Error toast is handled by API service
    } finally {
      setRemovingMemberId(null);
    }
  };
  // console.log(members);

  if (!members) {
    return (
      <div className='flex justify-center py-8'>
        <Loader />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header with invite button */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Users size={24} className='text-gray-600' />
          <h3 className='text-lg font-semibold text-gray-900'>
            Trip Members ({members.length})
          </h3>
        </div>

        {isTripOwner && (
          <Button
            variant='primary'
            size='sm'
            onClick={() => setIsInviteModalOpen(true)}
            className='flex items-center gap-2'
          >
            <UserPlus size={16} />
            Invite Member
          </Button>
        )}
      </div>

      {/* Members list */}
      {members.length === 0 ? (
        <div className='text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300'>
          <Users size={48} className='mx-auto text-gray-400 mb-4' />
          <p className='text-gray-600 mb-2'>No members yet</p>
          {isTripOwner && (
            <p className='text-sm text-gray-500'>
              Invite members to start planning together
            </p>
          )}
        </div>
      ) : (
        <div className='space-y-3'>
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isOwner={ownerId}
              isTripOwner={isTripOwner}
              currentUserId={currentUserId}
              onRemove={handleRemove}
              removing={removingMemberId === member._id}
            />
          ))}
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title='Invite Member'
        size='md'
      >
        <InviteMemberForm onInvite={handleInvite} inviting={inviting} />
      </Modal>
    </div>
  );
};

export default MemberList;
