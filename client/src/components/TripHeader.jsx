import { useState } from "react";
import { Calendar, MapPin, Edit2, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import Badge from "./Badge";
import Modal from "./Modal";
import TripEditForm from "./TripEditForm";
import { tripApi } from "../services/api.service";
import toast from "react-hot-toast";

/**
 * TripHeader component - displays trip header with title, dates, and actions
 */
const TripHeader = ({ trip, isOwner, onTripUpdate, onTripDelete }) => {
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTripStatus = () => {
    const now = new Date();
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);

    if (now < startDate) {
      return { label: "Upcoming", variant: "info" };
    } else if (now > endDate) {
      return { label: "Past", variant: "secondary" };
    } else {
      return { label: "Ongoing", variant: "success" };
    }
  };

  const status = getTripStatus();

  const handleBack = () => {
    navigate("/trips");
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedTrip) => {
    setIsEditModalOpen(false);
    onTripUpdate(updatedTrip);
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await tripApi.deleteTrip(trip.id || trip._id);
      toast.success("Trip deleted successfully");
      setIsDeleteModalOpen(false);
      onTripDelete();
      navigate("/trips");
    } catch (error) {
      console.error("Error deleting trip:", error);
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <div className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          {/* Back Button */}
          <button
            onClick={handleBack}
            className='flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors'
          >
            <ArrowLeft size={20} className='mr-2' />
            Back to Trips
          </button>

          {/* Header Content */}
          <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <h1 className='text-3xl font-bold text-gray-900'>
                  {trip.title}
                </h1>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>

              {trip.description && (
                <p className='text-gray-600 mb-4'>{trip.description}</p>
              )}

              <div className='flex flex-wrap gap-4 text-sm text-gray-600'>
                <div className='flex items-center'>
                  <Calendar size={16} className='mr-2' />
                  <span>
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                  </span>
                </div>

                {trip.destinationType && (
                  <div className='flex items-center'>
                    <MapPin size={16} className='mr-2' />
                    <span className='capitalize'>{trip.destinationType}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons (Owner Only) */}
            {isOwner && (
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleEdit}
                  className='flex items-center'
                >
                  <Edit2 size={16} className='mr-2' />
                  Edit
                </Button>
                <Button
                  variant='danger'
                  size='sm'
                  onClick={handleDeleteClick}
                  className='flex items-center'
                >
                  <Trash2 size={16} className='mr-2' />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleEditCancel}
        title='Edit Trip'
        size='lg'
      >
        <TripEditForm
          trip={trip}
          onSuccess={handleEditSuccess}
          onCancel={handleEditCancel}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        title='Delete Trip'
        size='md'
      >
        <div className='space-y-4'>
          <p className='text-gray-700'>
            Are you sure you want to delete <strong>{trip.title}</strong>? This
            action cannot be undone. All associated data including itinerary,
            expenses, messages, and photos will be permanently deleted.
          </p>
          <div className='flex justify-end gap-3'>
            <Button
              variant='outline'
              onClick={handleDeleteCancel}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant='danger'
              onClick={handleDeleteConfirm}
              loading={deleting}
              disabled={deleting}
            >
              Delete Trip
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TripHeader;
