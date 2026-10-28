import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import {
  tripApi,
  activityApi,
  notesApi,
  expenseApi,
  photoApi,
  plannerApi,
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
import BudgetSettings from "../components/features/expenses/BudgetSettings";
import CurrencyConverter from "../components/features/expenses/CurrencyConverter";
import TripWeather from "../components/features/weather/TripWeather";
import JoinRequestsPanel from "../components/trip/JoinRequestsPanel";
import TripChat from "../components/chat/TripChat";
import AiPlannerModal from "../components/features/trips/AiPlannerModal";
import LiveViewers from "../components/features/trips/LiveViewers";
import Button from "../components/ui/Button";
import useTripLive from "../hooks/useTripLive";
import Modal from "../components/ui/Modal";
import Loader from "../components/ui/Loader";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import { usePageTitle } from "../hooks/usePageTitle";
import { trackEvent } from "../utils/analytics";

// How a live change from another member is described in the toast
const LIVE_SECTIONS = {
  trip: "the trip details",
  activities: "the itinerary",
  checklist: "the checklist",
  notes: "the notes",
  expenses: "the expenses",
  photos: "the photos",
  members: "the members",
};

/**
 * TripDetailPage component - displays trip details with tab navigation
 */
const TripDetailPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  usePageTitle(trip?.title);
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

  // Checklist refresh (live updates from other members)
  const [checklistRefreshKey, setChecklistRefreshKey] = useState(0);

  // AI planner
  const [plannerEnabled, setPlannerEnabled] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);

  useEffect(() => {
    fetchTrip();
    fetchMembers();
  }, [tripId]);

  useEffect(() => {
    let active = true;
    plannerApi.getStatus().then((status) => {
      if (active) setPlannerEnabled(Boolean(status?.enabled));
    });
    return () => {
      active = false;
    };
  }, []);

  // Another member changed the trip: reload just that section
  const handleLiveChange = ({ resource, action, actorId }) => {
    if (resource === "trip" && action === "deleted") {
      toast.error("This trip was deleted by its owner");
      navigate("/trips");
      return;
    }

    switch (resource) {
      case "trip":
        fetchTrip({ silent: true });
        break;
      case "activities":
        setActivityRefreshKey((prev) => prev + 1);
        if (activeTab === "place-images") fetchPlaceImages();
        break;
      case "checklist":
        setChecklistRefreshKey((prev) => prev + 1);
        break;
      case "notes":
        setNoteRefreshKey((prev) => prev + 1);
        break;
      case "expenses":
        setExpenseRefreshKey((prev) => prev + 1);
        break;
      case "photos":
        if (activeTab === "photos") fetchPhotos({ silent: true });
        break;
      case "members":
        fetchMembers({ silent: true });
        fetchTrip({ silent: true });
        break;
      default:
        return;
    }

    const actor = members?.find(
      (member) => String(member.id || member._id) === actorId
    );
    // One toast per section, so a burst of changes doesn't stack up
    toast(`${actor?.name || "Another member"} updated ${LIVE_SECTIONS[resource]}`, {
      id: `live-${resource}`,
      icon: "🔄",
    });
  };

  const { viewerIds, isLive } = useTripLive(tripId, handleLiveChange);

  useEffect(() => {
    if (activeTab === "photos") {
      fetchPhotos();
    }
    if (activeTab === "place-images") {
      fetchPlaceImages();
    }
  }, [activeTab, tripId]);

  const fetchTrip = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const data = await tripApi.getTripById(tripId);
      setTrip(data);
    } catch (error) {
      console.error("Error fetching trip:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoadingMembers(true);
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
    setTrip((prev) => ({ ...prev, ...updatedTrip }));
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
      trackEvent("Expense added");
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
  const fetchPhotos = async ({ silent = false } = {}) => {
    try {
      if (!silent) setPhotosLoading(true);
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
          <h2 className='text-2xl font-bold text-gray-900 mb-2 dark:text-gray-100'>
            Trip not found
          </h2>
          <p className='text-gray-600 dark:text-gray-400'>
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
  const baseCurrency = trip.baseCurrency || "BDT";

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
    { id: "weather", label: "Weather & Packing" },
    { id: "photos", label: "Photos" },
  ];

  const selectTab = (tabId, tabElement) => {
    setActiveTab(tabId);
    tabElement?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  // Arrow keys, Home and End move between tabs (WAI-ARIA tabs pattern)
  const handleTabKeyDown = (event) => {
    const index = tabs.findIndex((tab) => tab.id === activeTab);
    const nextIndex = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    const nextTab = document.getElementById(`trip-tab-${tabs[nextIndex].id}`);
    nextTab?.focus();
    selectTab(tabs[nextIndex].id, nextTab);
  };

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-950'>
      <TripHeader
        trip={trip}
        isOwner={isOwner}
        onTripUpdate={handleTripUpdate}
        onTripDelete={handleTripDelete}
      />

      {/* Tab Navigation */}
      <div className='bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div
            className='flex space-x-6 sm:space-x-8 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0'
            role='tablist'
            aria-label='Trip sections'
            onKeyDown={handleTabKeyDown}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type='button'
                role='tab'
                id={`trip-tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls='trip-tabpanel'
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={(event) => selectTab(tab.id, event.currentTarget)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500
                  ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div
        className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'
        role='tabpanel'
        id='trip-tabpanel'
        aria-labelledby={`trip-tab-${activeTab}`}
      >
        <div className='mb-4'>
          <LiveViewers
            viewerIds={viewerIds}
            members={members || []}
            currentUserId={userId}
            isLive={isLive}
          />
        </div>

        {activeTab === "overview" && (
          <div className='space-y-6'>
            {/* Join Requests Panel - Only visible to owner */}
            <JoinRequestsPanel tripId={tripId} isOwner={isOwner} />

            {/* Trip Overview */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 dark:bg-gray-900 dark:border-gray-700'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4 dark:text-gray-100'>
                Trip Overview
              </h2>
              <div className='space-y-4'>
                <div>
                  <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                    Description
                  </h3>
                  <p className='mt-1 text-gray-900 dark:text-gray-100'>
                    {trip.description || "No description provided"}
                  </p>
                </div>
                <div>
                  <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400'>Members</h3>
                  <p className='mt-1 text-gray-900 dark:text-gray-100'>
                    {trip.members?.length || 0}{" "}
                    {trip.members?.length === 1 ? "member" : "members"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "itinerary" && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 dark:bg-gray-900 dark:border-gray-700'>
            {plannerEnabled && (
              <div className='mb-6 flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-blue-900 dark:bg-blue-950'>
                <p className='text-sm text-blue-900 dark:text-blue-100'>
                  Not sure where to start? Get a day-by-day plan based on
                  your budget and interests.
                </p>
                <Button size='sm' onClick={() => setIsPlannerOpen(true)}>
                  <Sparkles className='mr-2 h-4 w-4' aria-hidden='true' />
                  Plan with AI
                </Button>
              </div>
            )}
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
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 dark:bg-gray-900 dark:border-gray-700'>
            <MapView
              key={activityRefreshKey}
              tripId={tripId}
              tripStartDate={trip.startDate}
            />
          </div>
        )}

        {activeTab === "members" && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 dark:bg-gray-900 dark:border-gray-700'>
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
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
            <div className='space-y-6 lg:col-span-2 min-w-0'>
              <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 dark:bg-gray-900 dark:border-gray-700'>
                <ExpenseList
                  tripId={tripId}
                  baseCurrency={baseCurrency}
                  members={members || []}
                  onAddExpense={handleAddExpense}
                  onViewReceipt={handleViewReceipt}
                  onChange={() => setExpenseRefreshKey((prev) => prev + 1)}
                  refreshKey={expenseRefreshKey}
                />
              </div>
              <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 dark:bg-gray-900 dark:border-gray-700'>
                <SplitSummary
                  tripId={tripId}
                  refreshKey={expenseRefreshKey}
                  currentUserId={userId}
                  isOwner={isOwner}
                />
              </div>
            </div>
            <div className='space-y-6 min-w-0'>
              {isOwner && (
                <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 dark:bg-gray-900 dark:border-gray-700'>
                  <BudgetSettings
                    trip={trip}
                    onSaved={(updated) => {
                      setTrip((prev) => ({ ...prev, ...updated }));
                      setExpenseRefreshKey((prev) => prev + 1);
                    }}
                  />
                </div>
              )}
              <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 dark:bg-gray-900 dark:border-gray-700'>
                <CurrencyConverter baseCurrency={baseCurrency} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "checklist" && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 dark:bg-gray-900 dark:border-gray-700'>
            <ChecklistView
              tripId={tripId}
              canEdit={true}
              refreshKey={checklistRefreshKey}
            />
          </div>
        )}

        {activeTab === "notes" && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 dark:bg-gray-900 dark:border-gray-700'>
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

        {activeTab === "weather" && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 dark:bg-gray-900 dark:border-gray-700'>
            <TripWeather tripId={tripId} />
          </div>
        )}

        {activeTab === "photos" && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 dark:bg-gray-900 dark:border-gray-700'>
            {/* Header with Upload Button */}
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
                Gallery
                {photos.length > 0 && (
                  <span className='ml-2 text-sm font-normal text-gray-500 dark:text-gray-400'>
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
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 dark:bg-gray-900 dark:border-gray-700'>
              <div className='mb-6'>
                <h2 className='text-2xl font-bold text-gray-900 mb-2 dark:text-gray-100'>
                  Place Images from Wikimedia Commons
                </h2>
                <p className='text-gray-600 dark:text-gray-400'>
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
                <div className='text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 dark:bg-gray-950 dark:border-gray-600'>
                  <p className='text-gray-600 mb-2 dark:text-gray-400'>
                    No places with coordinates found
                  </p>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
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

      {/* AI Planner Modal */}
      {isPlannerOpen && (
        <AiPlannerModal
          isOpen={isPlannerOpen}
          onClose={() => setIsPlannerOpen(false)}
          tripId={tripId}
          trip={trip}
          onApplied={() => setActivityRefreshKey((prev) => prev + 1)}
        />
      )}

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
          baseCurrency={trip?.baseCurrency || "BDT"}
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
