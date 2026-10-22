import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import AdminRoute from "./components/shared/AdminRoute";
import ErrorBoundary from "./components/layout/ErrorBoundary";
import Navbar from "./components/layout/Navbar";
import OfflineBanner from "./components/layout/OfflineBanner";
import EmailVerificationBanner from "./components/auth/EmailVerificationBanner";
import { toastConfig } from "./utils/toast.config";
import Loader from "./components/ui/Loader";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AdminReportsPage = lazy(() => import("./pages/AdminReportsPage"));
const TripListPage = lazy(() => import("./pages/TripListPage"));
const TripDetailPage = lazy(() => import("./pages/TripDetailPage"));
const NotificationCenterPage = lazy(() => import("./pages/NotificationCenterPage"));
const PendingInvitationsPage = lazy(() => import("./pages/PendingInvitationsPage"));
const InvitationPreviewPage = lazy(() => import("./pages/InvitationPreviewPage"));
const DestinationDetailPage = lazy(() => import("./pages/DestinationDetailPage"));
const DestinationsPage = lazy(() => import("./pages/DestinationsPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const SharedTripPage = lazy(() => import("./pages/SharedTripPage"));
const JoinRequestsPage = lazy(() => import("./pages/JoinRequestsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const HomePage = lazy(() => import("./pages/HomePage"));

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <Router>
            <AuthProvider>
              <FavoritesProvider>
                <div className='min-h-screen bg-gray-50 dark:bg-gray-950'>
                  {/* Skip to main content link for keyboard navigation */}
                  <a href='#main-content' className='skip-to-main'>
                    Skip to main content
                  </a>

                  <Toaster
                    position={toastConfig.position}
                    toastOptions={{
                      duration: toastConfig.duration,
                      success: toastConfig.success,
                      error: toastConfig.error,
                      loading: toastConfig.loading,
                    }}
                  />
                  <Navbar />
                  <OfflineBanner />
                  <EmailVerificationBanner />
                  <main id='main-content'>
                    <Suspense fallback={<Loader />}>
                      <Routes>
                        <Route path='/' element={<HomePage />} />
                        <Route path='/login' element={<LoginPage />} />
                        <Route path='/register' element={<RegisterPage />} />
                        <Route
                          path='/forgot-password'
                          element={<ForgotPasswordPage />}
                        />
                        <Route
                          path='/reset-password'
                          element={<ResetPasswordPage />}
                        />
                        <Route path='/verify-email' element={<VerifyEmailPage />} />
                        <Route
                          path='/profile'
                          element={
                            <ProtectedRoute>
                              <ProfilePage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/trips'
                          element={
                            <ProtectedRoute>
                              <TripListPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/trips/:tripId'
                          element={
                            <ProtectedRoute>
                              <TripDetailPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/notifications'
                          element={
                            <ProtectedRoute>
                              <NotificationCenterPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/invitations'
                          element={
                            <ProtectedRoute>
                              <PendingInvitationsPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/invitations/:invitationId'
                          element={
                            <ProtectedRoute>
                              <InvitationPreviewPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/join-requests'
                          element={
                            <ProtectedRoute>
                              <JoinRequestsPage />
                            </ProtectedRoute>
                          }
                        />
                        {/* PUBLIC ROUTE - No authentication required */}
                        <Route path='/explore' element={<ExplorePage />} />
                        <Route path='/share/:token' element={<SharedTripPage />} />
                        <Route path='/destinations' element={<DestinationsPage />} />
                        <Route
                          path='/destinations/:destinationId'
                          element={<DestinationDetailPage />}
                        />
                        <Route
                          path='/favorites'
                          element={
                            <ProtectedRoute>
                              <FavoritesPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/admin'
                          element={
                            <AdminRoute>
                              <AdminDashboardPage />
                            </AdminRoute>
                          }
                        />
                        <Route
                          path='/admin/reports'
                          element={
                            <AdminRoute>
                              <AdminReportsPage />
                            </AdminRoute>
                          }
                        />
                        {/* 404 Not Found - Catch all unmatched routes */}
                        <Route path='*' element={<NotFoundPage />} />
                      </Routes>
                    </Suspense>
                  </main>
                </div>
              </FavoritesProvider>
            </AuthProvider>
          </Router>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
