import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/**
 * AdminRoute component that requires admin role
 * Redirects to home page if user is not an admin
 */
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  if (user?.role !== "admin") {
    // Redirect to home page if not an admin
    return <Navigate to='/' replace />;
  }

  return children;
};

export default AdminRoute;
