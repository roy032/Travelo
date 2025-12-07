import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import TripListPage from './pages/TripListPage';
import TripDetailPage from './pages/TripDetailPage';
import NotificationCenterPage from './pages/NotificationCenterPage';
import DestinationExplorerPage from './pages/DestinationExplorerPage';
import DestinationDetailPage from './pages/DestinationDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import HomePage from './pages/HomePage';
import { toastConfig } from './utils/toast.config';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <SocketProvider>
            <div className="min-h-screen bg-gray-50">
              {/* Skip to main content link for keyboard navigation */}
              <a href="#main-content" className="skip-to-main">
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
              <main id="main-content">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/trips"
                    element={
                      <ProtectedRoute>
                        <TripListPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/trips/:tripId"
                    element={
                      <ProtectedRoute>
                        <TripDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <NotificationCenterPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/destinations"
                    element={
                      <ProtectedRoute>
                        <DestinationExplorerPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/destinations/:destinationId"
                    element={
                      <ProtectedRoute>
                        <DestinationDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminDashboardPage />
                      </AdminRoute>
                    }
                  />
                  {/* 404 Not Found - Catch all unmatched routes */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
            </div>
          </SocketProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
