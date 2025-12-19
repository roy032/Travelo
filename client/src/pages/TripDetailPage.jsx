import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  tripApi,
  activityApi,
  notesApi,
  expenseApi,
  photoApi,
} from "../services/api.service";
import TripHeader from "../components/features/trips/TripHeader";
import MemberList from "../components/features/members/MemberList";
import ItineraryView from "../components/features/trips/ItineraryView";
import ActivityForm from "../components/features/trips/ActivityForm";
import MapView from "../components/features/trips/MapView";
import ChecklistView from "../components/features/checklist/ChecklistView";
import NotesList from "../components/features/notes/NotesList";
import NoteEditor from "../components/features/notes/NoteEditor";
import ExpenseList from "../components/features/expenses/ExpenseList";
import ExpenseForm from "../components/features/expenses/ExpenseForm";
import SplitSummary from "../components/features/expenses/SplitSummary";
import ReceiptViewer from "../components/features/expenses/ReceiptViewer";
import PhotoGrid from "../components/features/photos/PhotoGrid";
import PhotoUploadButton from "../components/features/photos/PhotoUploadButton";
import PlaceImageGallery from "../components/features/trips/PlaceImageGallery";
import PackageHelper from "../components/features/packing/PackageHelper";
import JoinRequestsPanel from "../components/trip/JoinRequestsPanel";
import TripChat from "../components/chat/TripChat";
import Modal from "../components/ui/Modal";
import Loader from "../components/ui/Loader";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

/**
 * TripDetailPage component - displays trip details with tab navigation
 */
const TripDetailPage = () => {
  const { tripId } = useParams();

  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Activity modal state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  // Note modal state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteRefreshKey, setNoteRefreshKey] = useState(0);

  // Expense modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseRefreshKey, setExpenseRefreshKey] = useState(0);

  // Receipt viewer state
  const [isReceiptViewerOpen, setIsReceiptViewerOpen] = useState(false);
  const [viewingExpense, setViewingExpense] = useState(null);

  // Photo gallery state
  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Place images state
  const [placeImages, setPlaceImages] = useState([]);
  const [placeImagesLoading, setPlaceImagesLoading] = useState(false);

  useEffect(() => {
    fetchTrip();
    fetchMembers();
  }, [tripId]);

  useEffect(() => {
    if (activeTab === "photos") {
      fetchPhotos();
    }
    if (activeTab === "place-images") {
      fetchPlaceImages();
    }
  }, [activeTab, tripId]);

  const fetchTrip = async () => {
    try {
      setLoading(true);
      const data = await tripApi.getTripById(tripId);
      setTrip(data);
    } catch (error) {
      console.error("Error fetching trip:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const data = await tripApi.getTripMembers(tripId);

      setMembers(data.members);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleMembersUpdate = (updatedMembers) => {
    setMembers(updatedMembers);
    // Also update the trip's member count
    if (trip) {
      setTrip({ ...trip, members: updatedMembers });
    }
  };

  const handleTripUpdate = (updatedTrip) => {
    setTrip(updatedTrip);
  };

  const handleTripDelete = () => {
    // Navigation is handled in TripHeader
  };

  // Activity handlers
  const handleAddActivity = (activity = null) => {
    setEditingActivity(activity);
    setIsActivityModalOpen(true);
  };

  const handleCloseActivityModal = () => {
    setIsActivityModalOpen(false);
    setEditingActivity(null);
  };

  const handleActivitySubmit = async (activityData) => {
    try {
      setActivityLoading(true);

      if (editingActivity) {
        // Update existing activity
        await activityApi.updateActivity(
          tripId,
          editingActivity.id,
          activityData
        );
        toast.success("Activity updated successfully");
      } else {
        // Create new activity
        await activityApi.createActivity(tripId, activityData);
        toast.success("Activity created successfully");
      }

      handleCloseActivityModal();
      // Trigger refresh of activities
      setActivityRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error saving activity:", error);
      toast.error(
        editingActivity
          ? "Failed to update activity"
          : "Failed to create activity"
      );
    } finally {
      setActivityLoading(false);
    }
  };

  // Note handlers
  const handleAddNote = (note = null) => {
    setEditingNote(note);
    setIsNoteModalOpen(true);
  };

  const handleCloseNoteModal = () => {
    setIsNoteModalOpen(false);
    setEditingNote(null);
  };

  const handleNoteSubmit = async (noteData) => {
    try {
      setNoteLoading(true);

      if (editingNote) {
        // Update existing note
        await notesApi.updateNote(tripId, editingNote._id, noteData);
        toast.success("Note updated successfully");
      } else {
        // Create new note
        await notesApi.createNote(tripId, noteData);
        toast.success("Note created successfully");
      }

      handleCloseNoteModal();
      // Trigger refresh of notes
      setNoteRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error(
        editingNote ? "Failed to update note" : "Failed to create note"
      );
    } finally {
      setNoteLoading(false);
    }
  };

  // Expense handlers
  const handleAddExpense = () => {
    setIsExpenseModalOpen(true);
  };

  const handleCloseExpenseModal = () => {
    setIsExpenseModalOpen(false);
  };

  const handleExpenseSubmit = async (expenseData, receiptFile) => {
    try {
      setExpenseLoading(true);

      // Create new expense
      await expenseApi.createExpense(tripId, expenseData, receiptFile);
      toast.success("Expense created successfully");

      handleCloseExpenseModal();
      // Trigger refresh of expenses
      setExpenseRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to create expense");
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleViewReceipt = (expense) => {
    setViewingExpense(expense);
    setIsReceiptViewerOpen(true);
  };

  const handleCloseReceiptViewer = () => {
    setIsReceiptViewerOpen(false);
    setViewingExpense(null);
  };

  // Photo handlers
  const fetchPhotos = async () => {
    try {
      setPhotosLoading(true);
      const data = await photoApi.getPhotos(tripId);
      setPhotos(data.photos || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
      toast.error("Failed to load photos");
    } finally {
      setPhotosLoading(false);
    }
  };

  const handlePhotoUpload = async (file, caption) => {
    try {
      setPhotoUploading(true);
      await photoApi.uploadPhoto(tripId, file, caption);
      toast.success("Photo uploaded successfully");
      // Refresh photos
      await fetchPhotos();
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
      throw error;
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoDelete = async (photoId) => {
    try {
      await photoApi.deletePhoto(tripId, photoId);
      toast.success("Photo deleted successfully");
      // Remove photo from state
      setPhotos(photos.filter((photo) => photo.id !== photoId));
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Failed to delete photo");
      throw error;
    }
  };

  // Place images handlers
  const fetchPlaceImages = async () => {
    try {
      setPlaceImagesLoading(true);
      const data = await activityApi.getMapData(tripId);

      // Filter activities that have valid coordinates
      const activitiesWithCoordinates = data.activities.filter(
        (activity) =>
          activity.location?.coordinates?.lat &&
          activity.location?.coordinates?.lng
      );

      setPlaceImages(activitiesWithCoordinates);
    } catch (error) {
      console.error("Error fetching place images:", error);
      toast.error("Failed to load place images");
    } finally {
      setPlaceImagesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            Trip not found
          </h2>
          <p className='text-gray-600'>
            The trip you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  // Owner can be a populated object with _id or id, or just a string ID
  const ownerId = trip.owner?._id || trip.owner?.id || trip.owner;
  const userId = user?.id || user?._id;
  const isOwner = ownerId === userId;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "itinerary", label: "Itinerary" },
    { id: "map", label: "Map" },
    { id: "place-images", label: "Place Images" },
    { id: "chat", label: "Chat" },
    { id: "members", label: "Members" },
    { id: "expenses", label: "Expenses" },
    { id: "checklist", label: "Checklist" },
    { id: "notes", label: "Notes" },
    { id: "package-helper", label: "Package Helper" },
    { id: "photos", label: "Photos" },
  ];
  return (
    <div className='min-h-screen bg-gray-50'>
      <TripHeader
        trip={trip}
        isOwner={isOwner}
        onTripUpdate={handleTripUpdate}
        onTripDelete={handleTripDelete}
      />

      {/* Tab Navigation */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <nav className='flex space-x-8 overflow-x-auto' aria-label='Tabs'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {activeTab === "overview" && (
          <div className='space-y-6'>
            {/* Join Requests Panel - Only visible to owner */}
            <JoinRequestsPanel tripId={tripId} isOwner={isOwner} />

            {/* Trip Overview */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                Trip Overview
              </h2>
              <div className='space-y-4'>
                <div>
                  <h3 className='text-sm font-medium text-gray-500'>
                    Description
                  </h3>
                  <p className='mt-1 text-gray-900'>
                    {trip.description || "No description provided"}
                  </p>
                </div>
                <div>
                  <h3 className='text-sm font-medium text-gray-500'>Members</h3>
                  <p className='mt-1 text-gray-900'>
                    {trip.members?.length || 0}{" "}
                    {trip.members?.length === 1 ? "member" : "members"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "itinerary" && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <ItineraryView
              tripId={tripId}
              tripStartDate={trip.startDate}
              tripEndDate={trip.endDate}
              onAddActivity={handleAddActivity}
              canEdit={true}
              refreshKey={activityRefreshKey}
            />
          </div>
        )}

        {activeTab === "map" && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <MapView tripId={tripId} />
          </div>
        )}

        {activeTab === "members" && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            {loadingMembers ? (
              <div className='flex justify-center py-8'>
                <Loader />
              </div>
            ) : (
              <MemberList
                tripId={tripId}
                members={members}
                ownerId={trip.owner?._id || trip.owner?.id || trip.owner}
                currentUserId={user?.id}
                isTripOwner={isOwner}
                onMembersUpdate={handleMembersUpdate}
              />
            )}
          </div>
        )}

        {activeTab === "chat" && (
          <div className='max-w-4xl mx-auto'>
            <TripChat tripId={tripId} />
          </div>
        )}

        {activeTab === "expenses" && (
          <div className='space-y-6'>
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <ExpenseList
                tripId={tripId}
                onAddExpense={handleAddExpense}
                onViewReceipt={handleViewReceipt}
                refreshKey={expenseRefreshKey}
              />
            </div>
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <SplitSummary tripId={tripId} refreshKey={expenseRefreshKey} />
            </div>
          </div>
        )}

        {activeTab === "checklist" && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <ChecklistView tripId={tripId} canEdit={true} />
          </div>
        )}

        {activeTab === "notes" && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <NotesList
              key={noteRefreshKey}
              tripId={tripId}
              currentUserId={user?.id}
              onAddNote={handleAddNote}
              onEditNote={handleAddNote}
              canEdit={true}
            />
          </div>
        )}

        {activeTab === "package-helper" && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <PackageHelper tripId={tripId} startDate={trip.startDate} />
          </div>
        )}

        {activeTab === "photos" && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            {/* Header with Upload Button */}
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-semibold text-gray-900'>
                Gallery
                {photos.length > 0 && (
                  <span className='ml-2 text-sm font-normal text-gray-500'>
                    ({photos.length} {photos.length === 1 ? "photo" : "photos"})
                  </span>
                )}
              </h2>
              <PhotoUploadButton
                onUpload={handlePhotoUpload}
                loading={photoUploading}
              />
            </div>

            {/* Photo Grid */}
            <PhotoGrid
              photos={photos}
              onDeletePhoto={handlePhotoDelete}
              currentUserId={user?.id}
              loading={photosLoading}
            />
          </div>
        )}

        {activeTab === "place-images" && (
          <div className='space-y-6'>
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <div className='mb-6'>
                <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                  Place Images from Wikimedia Commons
                </h2>
                <p className='text-gray-600'>
                  Explore images of your trip destinations sourced from
                  Wikimedia Commons. Images are shown for activities with
                  location coordinates.
                </p>
              </div>

              {placeImagesLoading ? (
                <div className='flex justify-center py-12'>
                  <Loader size='lg' text='Loading place images...' />
                </div>
              ) : placeImages.length === 0 ? (
                <div className='text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300'>
                  <p className='text-gray-600 mb-2'>
                    No places with coordinates found
                  </p>
                  <p className='text-sm text-gray-500'>
                    Add coordinates to your activities in the itinerary to see
                    images from Wikimedia Commons
                  </p>
                </div>
              ) : (
                <div className='space-y-6'>
                  {placeImages.map((activity, index) => (
                    <PlaceImageGallery
                      key={index}
                      placeName={activity.location.name}
                      latitude={activity.location.coordinates.lat}
                      longitude={activity.location.coordinates.lng}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Activity Modal */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={handleCloseActivityModal}
        title={editingActivity ? "Edit Activity" : "Add Activity"}
        size='lg'
      >
        <ActivityForm
          activity={editingActivity}
          tripStartDate={trip?.startDate}
          tripEndDate={trip?.endDate}
          onSubmit={handleActivitySubmit}
          onCancel={handleCloseActivityModal}
          loading={activityLoading}
        />
      </Modal>

      {/* Note Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={handleCloseNoteModal}
        title={editingNote ? "Edit Note" : "Create Note"}
        size='lg'
      >
        <NoteEditor
          note={editingNote}
          onSubmit={handleNoteSubmit}
          onCancel={handleCloseNoteModal}
          loading={noteLoading}
        />
      </Modal>

      {/* Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={handleCloseExpenseModal}
        title='Add Expense'
        size='lg'
      >
        <ExpenseForm
          members={members || []}
          onSubmit={handleExpenseSubmit}
          onCancel={handleCloseExpenseModal}
          loading={expenseLoading}
        />
      </Modal>

      {/* Receipt Viewer Modal */}
      <ReceiptViewer
        isOpen={isReceiptViewerOpen}
        onClose={handleCloseReceiptViewer}
        expense={viewingExpense}
      />
    </div>
  );
};

export default TripDetailPage;
