import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Shield,
  Download,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import NotificationBell from "../features/notifications/NotificationBell";
import Avatar from "../ui/Avatar";

/**
 * Navbar component
 * Main navigation with user menu and notifications
 */
const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const installApp = useInstallPrompt();

  // Close the user menu on a tap or click outside it
  useEffect(() => {
    if (!isUserMenuOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!userMenuRef.current?.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isUserMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Show simplified navbar for unauthenticated users
  if (!isAuthenticated) {
    return (
      <nav
        className='bg-white shadow-sm border-b border-gray-200'
        role='navigation'
        aria-label='Main navigation'
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            {/* Logo */}
            <div className='flex items-center'>
              <Link
                to='/'
                className='flex items-center'
                aria-label='Travelo home'
              >
                <span className='text-2xl font-bold text-blue-600'>
                  Travelo
                </span>
              </Link>
            </div>

            {/* Public links and Auth buttons */}
            <div className='flex items-center gap-1 sm:gap-4'>
              <Link
                to='/explore'
                className='px-2 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded'
              >
                Explore
              </Link>
              <Link
                to='/login'
                className='px-2 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded whitespace-nowrap'
              >
                Sign In
              </Link>
              <Link
                to='/register'
                className='px-3 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap'
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className='bg-white shadow-sm border-b border-gray-200'
      role='navigation'
      aria-label='Main navigation'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          {/* Logo and main navigation */}
          <div className='flex items-center'>
            <Link
              to='/trips'
              className='flex items-center'
              aria-label='Travelo home'
            >
              <span className='text-2xl font-bold text-blue-600'>Travelo</span>
            </Link>

            {/* Desktop navigation links */}
            <div className='hidden md:ml-8 md:flex md:space-x-4' role='menubar'>
              <Link
                to='/trips'
                className='px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
                role='menuitem'
              >
                My Trips
              </Link>
              <Link
                to='/explore'
                className='px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
                role='menuitem'
              >
                Explore
              </Link>
              <Link
                to='/join-requests'
                className='px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
                role='menuitem'
              >
                Join Requests
              </Link>
              {user?.role === "admin" && (
                <Link
                  to='/admin'
                  className='px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  role='menuitem'
                >
                  <Shield size={16} aria-hidden='true' />
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Right side - Notifications and user menu */}
          <div className='flex items-center gap-2 sm:gap-4'>
            {/* Notification Bell */}
            <NotificationBell />

            {/* User menu */}
            <div className='relative' ref={userMenuRef}>
              <button
                onClick={toggleUserMenu}
                className='flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
                aria-label='User menu'
                aria-expanded={isUserMenuOpen}
                aria-haspopup='true'
              >
                <Avatar name={user?.name} size='sm' />
                <span className='hidden md:block text-sm font-medium text-gray-700'>
                  {user?.name}
                </span>
              </button>

              {/* User dropdown menu */}
              {isUserMenuOpen && (
                <div
                  className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50'
                  role='menu'
                  aria-label='User menu options'
                >
                  <Link
                    to='/profile'
                    onClick={() => setIsUserMenuOpen(false)}
                    className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100'
                    role='menuitem'
                  >
                    <User size={16} aria-hidden='true' />
                    Profile
                  </Link>
                  <Link
                    to='/notifications'
                    onClick={() => setIsUserMenuOpen(false)}
                    className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 md:hidden focus:outline-none focus:bg-gray-100'
                    role='menuitem'
                  >
                    <Settings size={16} aria-hidden='true' />
                    Notifications
                  </Link>
                  {installApp && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        installApp();
                      }}
                      className='flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100'
                      role='menuitem'
                    >
                      <Download size={16} aria-hidden='true' />
                      Install app
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className='flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:bg-red-50'
                    role='menuitem'
                  >
                    <LogOut size={16} aria-hidden='true' />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className='md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X size={24} aria-hidden='true' />
              ) : (
                <Menu size={24} aria-hidden='true' />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div
          className='md:hidden border-t border-gray-200'
          role='menu'
          aria-label='Mobile navigation menu'
        >
          <div className='px-2 pt-2 pb-3 space-y-1'>
            <Link
              to='/trips'
              onClick={() => setIsMobileMenuOpen(false)}
              className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
              role='menuitem'
            >
              My Trips
            </Link>
            <Link
              to='/explore'
              onClick={() => setIsMobileMenuOpen(false)}
              className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
              role='menuitem'
            >
              Explore
            </Link>
            <Link
              to='/join-requests'
              onClick={() => setIsMobileMenuOpen(false)}
              className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
              role='menuitem'
            >
              Join Requests
            </Link>
            {user?.role === "admin" && (
              <Link
                to='/admin'
                onClick={() => setIsMobileMenuOpen(false)}
                className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
                role='menuitem'
              >
                Admin Dashboard
              </Link>
            )}
            {installApp && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  installApp();
                }}
                className='flex w-full items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
                role='menuitem'
              >
                <Download size={18} aria-hidden='true' />
                Install the Travelo app
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
