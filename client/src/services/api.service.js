import toast from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_URL + "/api" || "http://localhost:3000/api";

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Fetch wrapper with error handling and token management
 */
async function fetchWithAuth(endpoint, options = {}) {
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Include cookies for JWT token
  };

  // Remove Content-Type for FormData (browser sets it with boundary)
  if (options.body instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle different response types
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle error responses
    if (!response.ok) {
      const errorMessage = data?.message || data?.error || "An error occurred";
      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    // Network errors or other fetch failures
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error
    throw new ApiError("Network error. Please check your connection.", 0, null);
  }
}

/**
 * Handle API errors with toast notifications
 */
function handleApiError(error) {
  if (error instanceof ApiError) {
    // Show user-friendly error messages
    switch (error.status) {
      case 400:
        toast.error(error.message || "Invalid request");
        break;
      case 401:
        toast.error("Please log in to continue");
        break;
      case 403:
        toast.error("You do not have permission to perform this action");
        break;
      case 404:
        toast.error(error.message || "Resource not found");
        break;
      case 409:
        toast.error(error.message || "Conflict occurred");
        break;
      case 413:
        toast.error("File is too large");
        break;
      case 415:
        toast.error("Unsupported file type");
        break;
      case 500:
        toast.error("Server error. Please try again later");
        break;
      default:
        toast.error(error.message || "An unexpected error occurred");
    }
  } else {
    toast.error("Network error. Please check your connection.");
  }
  throw error;
}

// ============================================================================
// Authentication Endpoints
// ============================================================================

export const authApi = {
  register: async (userData) => {
    try {
      console.log("register api hit");
      return await fetchWithAuth("/auth/sign-up", {
        method: "POST",
        body: JSON.stringify(userData),
      });
    } catch (error) {
      return handleApiError(error);
    }
  },

  login: async (credentials) => {
    try {
      return await fetchWithAuth("/auth/sign-in", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
    } catch (error) {
      return handleApiError(error);
    }
  },

  logout: async () => {
    try {
      return await fetchWithAuth("/auth/signout", {
        method: "POST",
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============================================================================
// User Profile Endpoints
// ============================================================================

export const profileApi = {
  getProfile: async () => {
    try {
      const response = await fetchWithAuth("/profile");
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await fetchWithAuth("/profile", {
        method: "PUT",
        body: JSON.stringify(profileData),
      });
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  uploadDocument: async (file, documentType = "nid") => {
    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("documentType", documentType);

      const response = await fetchWithAuth("/documents/upload", {
        method: "POST",
        body: formData,
      });
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============================================================================
// User Management Endpoints
// ============================================================================

export const userApi = {
  getAllUsers: async () => {
    try {
      return await fetchWithAuth("/users");
    } catch (error) {
      return handleApiError(error);
    }
  },

  getUserById: async (userId) => {
    try {
      return await fetchWithAuth(`/users/${userId}`);
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateUser: async (userId, userData) => {
    try {
      return await fetchWithAuth(`/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(userData),
      });
    } catch (error) {
      return handleApiError(error);
    }
  },

  deleteUser: async (userId) => {
    try {
      return await fetchWithAuth(`/users/${userId}`, {
        method: "DELETE",
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============================================================================
// Admin Endpoints
// ============================================================================

export const adminApi = {
  getAllUsers: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetchWithAuth(
        `/admin/users${queryString ? `?${queryString}` : ""}`
      );
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getUserStatistics: async () => {
    try {
      const response = await fetchWithAuth("/admin/statistics");
      return response.statistics || [];
    } catch (error) {
      return handleApiError(error);
    }
  },

  getPendingVerifications: async () => {
    try {
      const response = await fetchWithAuth("/admin/verifications/pending");
      return response.users || [];
    } catch (error) {
      return handleApiError(error);
    }
  },

  approveVerification: async (userId, verificationType) => {
    try {
      const response = await fetchWithAuth(
        `/admin/verifications/${userId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ verificationType }),
        }
      );
      return response.user;
    } catch (error) {
      return handleApiError(error);
    }
  },

  rejectVerification: async (userId, verificationType) => {
    try {
      const response = await fetchWithAuth(
        `/admin/verifications/${userId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ verificationType }),
        }
      );
      return response.user;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      const response = await fetchWithAuth(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  toggleUserBlock: async (userId, blocked) => {
    try {
      const response = await fetchWithAuth(`/admin/users/${userId}/block`, {
        method: "PATCH",
        body: JSON.stringify({ blocked }),
      });
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await fetchWithAuth(`/admin/users/${userId}`, {
        method: "DELETE",
      });
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  deleteTrip: async (tripId, message, reportId = null) => {
    try {
      const response = await fetchWithAuth(`/admin/trips/${tripId}`, {
        method: "DELETE",
        body: JSON.stringify({ message, reportId }),
      });
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============================================================================
// Trip Endpoints
// ============================================================================

export const tripApi = {
  // Public endpoint - no authentication required
  getPublicTrips: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/trips/explore`);

      if (!response.ok) {
        throw new Error("Failed to fetch public trips");
      }

      const data = await response.json();
      return data.trips || [];
    } catch (error) {
      console.error("Error fetching public trips:", error);
      return [];
    }
  },

  getUserTrips: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetchWithAuth(
        `/trips${queryString ? `?${queryString}` : ""}`
      );
      return response.trips || [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  getTripById: async (tripId) => {
    try {
      const response = await fetchWithAuth(`/trips/${tripId}`);
      return response.trip;
    } catch (error) {
      return handleApiError(error);
    }
  },

  createTrip: async (tripData) => {
    try {
      const response = await fetchWithAuth("/trips", {
        method: "POST",
        body: JSON.stringify(tripData),
      });
      return response.trip;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateTrip: async (tripId, tripData) => {
    try {
      const response = await fetchWithAuth(`/trips/${tripId}`, {
        method: "PUT",
        body: JSON.stringify(tripData),
      });
      return response.trip;
    } catch (error) {
      return handleApiError(error);
    }
  },

  deleteTrip: async (tripId) => {
    try {
      return await fetchWithAuth(`/trips/${tripId}`, {
        method: "DELETE",
      });
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Member management
  getTripMembers: async (tripId) => {
    try {
      const response = await fetchWithAuth(`/trips/${tripId}/members`);
      return response || [];
    } catch (error) {
      return handleApiError(error);
    }
  },

  inviteMember: async (tripId, email) => {
    try {
      const response = await fetchWithAuth(`/trips/${tripId}/members`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      return response.trip;
    } catch (error) {
      return handleApiError(error);
    }
  },

  removeMember: async (tripId, userId) => {
    try {
      const response = await fetchWithAuth(
        `/trips/${tripId}/members/${userId}`,
        {
          method: "DELETE",
        }
      );
      return response.trip;
    } catch (error) {
      return handleApiError(error);
    }
  },

  requestToJoin: async (tripId, userId) => {
    try {
      const response = await fetchWithAuth(`/trips/${tripId}/join-request`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      toast.success(response.message || "Join request sent successfully!");
      return response;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  getJoinRequests: async (tripId) => {
    try {
      const response = await fetchWithAuth(`/trips/${tripId}/join-requests`);
      return response.requests || [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  acceptJoinRequest: async (tripId, notificationId) => {
    try {
      const response = await fetchWithAuth(
        `/trips/${tripId}/join-requests/${notificationId}/accept`,
        {
          method: "POST",
        }
      );
      toast.success("Join request accepted!");
      return response;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  rejectJoinRequest: async (tripId, notificationId) => {
    try {
      const response = await fetchWithAuth(
        `/trips/${tripId}/join-requests/${notificationId}/reject`,
        {
          method: "POST",
        }
      );
      toast.success("Join request rejected");
      return response;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
};

// ============================================================================
// Activity (Itinerary) Endpoints
// ============================================================================

export const activityApi = {
  getActivities: async (tripId) => {
    try {
      const response = await fetchWithAuth(`/trips/${tripId}/activities`);
      return response.activities || [];
    } catch (error) {
      return handleApiError(error);
    }
  },

  createActivity: async (tripId, activityData) => {
    try {
      const response = await fetchWithAuth(`/trips/${tripId}/activities`, {
        method: "POST",
        body: JSON.stringify(activityData),
      });
      return response.activity;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateActivity: async (tripId, activityId, activityData) => {
    try {
      const response = await fetchWithAuth(
        `/trips/${tripId}/activities/${activityId}`,
        {
          method: "PUT",
          body: JSON.stringify(activityData),
        }
      );
      return response.activity;
    } catch (error) {
      return handleApiError(error);
    }
  },

  deleteActivity: async (tripId, activityId) => {
    try {
      return await fetchWithAuth(`/trips/${tripId}/activities/${activityId}`, {
        method: "DELETE",
      });
    } catch (error) {
      return handleApiError(error);
    }
  },

  getMapData: async (tripId) => {
    try {
      const response = await fetchWithAuth(`/trips/${tripId}/map`);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============================================================================
// Checklist Endpoints
// ============================================================================

export const checklistApi = {
  getChecklist: async (tripId) => {
    try {
      const response = await fetchWithAuth(`/trips/${tripId}/checklist`);
      return response.checklistItems || [];
    } catch (error) {
      return handleApiError(error);
    }
  },

  createItem: async (tripId, text) => {
    try {
      const response = await fetchWithAuth(`/trips/${tripId}/checklist`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      return response.checklistItem;
    } catch (error) {
      return handleApiError(error);
    }
  },

  toggleItem: async (tripId, itemId) => {
    try {
      const response = await fetchWithAuth(`/checklist/${itemId}/toggle`, {
        method: "PATCH",
      });
      return response.checklistItem;
    } catch (error) {
      return handleApiError(error);
    }
  },

  deleteItem: async (tripId, itemId) => {
    try {
      return await fetchWithAuth(`/checklist/${itemId}`, {
        method: "DELETE",
      });
    } catch (error) {
      return handleApiError(error);
    }
  },

  triggerReminders: async () => {
    try {
      return await fetchWithAuth(`/checklist/trigger-reminders`, {
        method: "POST",
      });
    } catch (error) {
      // Silent fail - this is a background task
      console.error("Failed to trigger checklist reminders:", error);
      return null;
    }
  },
};

// ============================================================================
// Notes Endpoints
// ============================================================================

export const notesApi = {
  getNotes: async (tripId) => {
    try {
      const response = await fetchWithAuth(`/trips/${tripId}/notes`);
      return response.notes || [];
    } catch (error) {
      return handleApiError(error);
    }
  },

  createNote: async (tripId, noteData) => {
    try {
      const response = await fetchWithAuth(`/trips/${tripId}/notes`, {
        method: "POST",
        body: JSON.stringify(noteData),
      });
      return response.note;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateNote: async (tripId, noteId, noteData) => {
    try {
      const response = await fetchWithAuth(`/notes/${noteId}`, {
        method: "PATCH",
        body: JSON.stringify(noteData),
      });
      return response.note;
    } catch (error) {
      return handleApiError(error);
    }
  },

  deleteNote: async (tripId, noteId) => {
    try {
      return await fetchWithAuth(`/notes/${noteId}`, {
        method: "DELETE",
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============================================================================
// Expense Endpoints
// ============================================================================

export const expenseApi = {
  getExpenses: async (tripId) => {
    try {
      const response = await fetchWithAuth(`/trips/${tripId}/expenses`);
      return response || [];
    } catch (error) {
      return handleApiError(error);
    }
  },

  createExpense: async (tripId, expenseData, receiptFile = null) => {
    try {
      console.log("Creating expense with receipt file:", receiptFile);
      let body;
      if (receiptFile) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append("amount", expenseData.amount);
        formData.append("currency", "BDT");
        formData.append("category", expenseData.category);
        formData.append("description", expenseData.description);
        formData.append("payer", expenseData.payer);
        formData.append("receipt", receiptFile);
        console.log("FormData created with receipt");
        body = formData;
      } else {
        body = JSON.stringify(expenseData);
      }

      const response = await fetchWithAuth(`/trips/${tripId}/expenses`, {
        method: "POST",
        body,
      });
      console.log("Expense created response:", response);
      return response.expense;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateExpense: async (tripId, expenseId, expenseData, receiptFile = null) => {
    try {
      let body;
      if (receiptFile) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append("amount", expenseData.amount);
        formData.append("currency", "BDT");
        formData.append("category", expenseData.category);
        formData.append("description", expenseData.description);
        formData.append("payer", expenseData.payer);
        formData.append("receipt", receiptFile);
        body = formData;
      } else {
        body = JSON.stringify(expenseData);
      }

      const response = await fetchWithAuth(
        `/trips/${tripId}/expenses/${expenseId}`,
        {
          method: "PUT",
          body,
        }
      );
      return response.expense;
    } catch (error) {
      return handleApiError(error);
    }
  },

  deleteExpense: async (tripId, expenseId) => {
    try {
      return await fetchWithAuth(`/trips/${tripId}/expenses/${expenseId}`, {
        method: "DELETE",
      });
    } catch (error) {
      return handleApiError(error);
    }
  },

  uploadReceipt: async (tripId, expenseId, file) => {
    try {
      const formData = new FormData();
      formData.append("receipt", file);

      return await fetchWithAuth(
        `/trips/${tripId}/expenses/${expenseId}/receipt`,
        {
          method: "POST",
          body: formData,
        }
      );
    } catch (error) {
      return handleApiError(error);
    }
  },

  getSplits: async (tripId) => {
    try {
      return await fetchWithAuth(`/trips/${tripId}/expenses/splits`);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============================================================================
// Chat Endpoints
// ============================================================================
// Photo Endpoints
// ============================================================================

export const photoApi = {
  getPhotos: async (tripId) => {
    try {
      const response = await fetchWithAuth(`/trips/${tripId}/photos`);
      return response; // Return the full response object with photos array
    } catch (error) {
      return handleApiError(error);
    }
  },

  uploadPhoto: async (tripId, file, caption = "") => {
    try {
      const formData = new FormData();
      formData.append("photo", file);
      if (caption) {
        formData.append("caption", caption);
      }

      const response = await fetchWithAuth(`/trips/${tripId}/photos`, {
        method: "POST",
        body: formData,
      });
      return response.photo;
    } catch (error) {
      return handleApiError(error);
    }
  },

  deletePhoto: async (tripId, photoId) => {
    try {
      return await fetchWithAuth(`/trips/${tripId}/photos/${photoId}`, {
        method: "DELETE",
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============================================================================
// Notification Endpoints
// ============================================================================

export const notificationApi = {
  getNotifications: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetchWithAuth(
        `/notifications${queryString ? `?${queryString}` : ""}`
      );
      console.log(response);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await fetchWithAuth("/notifications/unread-count");

      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await fetchWithAuth(
        `/notifications/${notificationId}/read`,
        {
          method: "PATCH",
        }
      );
      return response.notification;
    } catch (error) {
      return handleApiError(error);
    }
  },

  markAllAsRead: async () => {
    try {
      return await fetchWithAuth("/notifications/read-all", {
        method: "PATCH",
      });
    } catch (error) {
      return handleApiError(error);
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      return await fetchWithAuth(`/notifications/${notificationId}`, {
        method: "DELETE",
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============================================================================
// Invitation Endpoints
// ============================================================================

export const invitationApi = {
  getPendingInvitations: async () => {
    try {
      const response = await fetchWithAuth("/invitations/pending");
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getInvitationById: async (invitationId) => {
    try {
      const response = await fetchWithAuth(`/invitations/${invitationId}`);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getInvitationPreview: async (invitationId) => {
    try {
      const response = await fetchWithAuth(
        `/invitations/${invitationId}/preview`
      );
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  acceptInvitation: async (invitationId) => {
    try {
      const response = await fetchWithAuth(
        `/invitations/${invitationId}/accept`,
        {
          method: "POST",
        }
      );
      toast.success("Invitation accepted successfully");
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  rejectInvitation: async (invitationId) => {
    try {
      const response = await fetchWithAuth(
        `/invitations/${invitationId}/reject`,
        {
          method: "POST",
        }
      );
      toast.success("Invitation declined");
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  cancelInvitation: async (invitationId) => {
    try {
      const response = await fetchWithAuth(`/invitations/${invitationId}`, {
        method: "DELETE",
      });
      toast.success("Invitation cancelled");
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getTripInvitations: async (tripId) => {
    try {
      const response = await fetchWithAuth(`/trips/${tripId}/invitations`);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  sendInvitation: async (tripId, email) => {
    try {
      const response = await fetchWithAuth(`/trips/${tripId}/invitations`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      toast.success("Invitation sent successfully");
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============================================================================
// Destination Endpoints
// ============================================================================

export const destinationApi = {
  getDestinations: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetchWithAuth(
        `/destinations${queryString ? `?${queryString}` : ""}`
      );
      return response.destinations || [];
    } catch (error) {
      return handleApiError(error);
    }
  },

  getDestinationById: async (destinationId) => {
    try {
      const response = await fetchWithAuth(`/destinations/${destinationId}`);
      return response.destination;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============================================================================
// Packing Suggestions Endpoints
// ============================================================================

export const packingApi = {
  getSuggestions: async (tripId) => {
    try {
      const response = await fetchWithAuth(
        `/trips/${tripId}/packing-suggestions`
      );
      return response.data || response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  addSuggestionsToChecklist: async (tripId, items) => {
    try {
      const response = await fetchWithAuth(
        `/trips/${tripId}/packing-suggestions/add-to-checklist`,
        {
          method: "POST",
          body: JSON.stringify({ items }),
        }
      );
      return response.data || response;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============================================================================
// Report Endpoints
// ============================================================================

export const reportApi = {
  // User endpoint to report a trip
  reportTrip: async (tripId, reportData) => {
    try {
      const response = await fetchWithAuth(`/trips/${tripId}/report`, {
        method: "POST",
        body: JSON.stringify(reportData),
      });
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Admin endpoints
  getAllReports: async (filters = {}) => {
    try {
      const queryString = new URLSearchParams(
        Object.entries(filters).filter(([_, value]) => value !== "")
      ).toString();
      const response = await fetchWithAuth(
        `/admin/reports${queryString ? `?${queryString}` : ""}`
      );
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getReportById: async (reportId) => {
    try {
      const response = await fetchWithAuth(`/admin/reports/${reportId}`);
      return response.report;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateReportStatus: async (reportId, updateData) => {
    try {
      const response = await fetchWithAuth(`/admin/reports/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getStatistics: async () => {
    try {
      const response = await fetchWithAuth("/admin/reports/statistics");
      return response.statistics;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============================================================================
// Message/Chat Endpoints
// ============================================================================

export const messageApi = {
  // Get paginated messages for a trip
  getMessages: async (tripId, params = {}) => {
    try {
      const queryString = new URLSearchParams(
        Object.entries(params).filter(([_, value]) => value != null)
      ).toString();
      const response = await fetchWithAuth(
        `/trips/${tripId}/messages${queryString ? `?${queryString}` : ""}`
      );
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Send a message (REST fallback, prefer Socket.IO)
  sendMessage: async (tripId, text) => {
    try {
      const response = await fetchWithAuth(`/trips/${tripId}/messages`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Export all APIs
export default {
  auth: authApi,
  profile: profileApi,
  user: userApi,
  admin: adminApi,
  trip: tripApi,
  activity: activityApi,
  checklist: checklistApi,
  notes: notesApi,
  expense: expenseApi,
  photo: photoApi,
  notification: notificationApi,
  invitation: invitationApi,
  destination: destinationApi,
  packing: packingApi,
  report: reportApi,
  message: messageApi,
};
