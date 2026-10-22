import { Link, NavLink, useNavigate } from "react-router-dom";
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
import ThemeToggle from "../ui/ThemeToggle";

const MAIN_LINKS = [
  { to: "/trips", label: "My Trips" },
  { to: "/explore", label: "Explore" },
  { to: "/destinations", label: "Destinations" },
  { to: "/favorites", label: "Saved" },
  { to: "/join-requests", label: "Join Requests" },
];

const desktopLinkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    isActive
      ? "text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/40"
      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
  }`;

const mobileLinkClass = ({ isActive }) =>
  `block px-3 py-2 rounded-md text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    isActive
      ? "text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/40"
      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
  }`;

const publicLinkClass = ({ isActive }) =>
  `px-2 sm:px-4 py-2 text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap ${
    isActive
      ? "text-blue-700 dark:text-blue-300"
      : "text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
  }`;

const menuItemClass =
  "flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:bg-gray-800";

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
  const userMenuButtonRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
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

  // Escape closes an open menu and returns focus to its button
  useEffect(() => {
    if (!isUserMenuOpen && !isMobileMenuOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (isUserMenuOpen) {
        setIsUserMenuOpen(false);
        userMenuButtonRef.current?.focus();
      } else {
        setIsMobileMenuOpen(false);
        mobileMenuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isUserMenuOpen, isMobileMenuOpen]);

  // Moving focus out of the user menu (e.g. tabbing past it) closes it
  const handleUserMenuBlur = (event) => {
    if (!userMenuRef.current?.contains(event.relatedTarget)) {
      setIsUserMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Show simplified navbar for unauthenticated users
  if (!isAuthenticated) {
    return (
      <nav
        className='bg-white shadow-sm border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700'
        aria-label='Main navigation'
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            {/* Logo */}
            <div className='flex items-center'>
              <Link
                to='/'
                className='flex items-center rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                aria-label='Travelo home'
              >
                <span className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                  Travelo
                </span>
              </Link>
            </div>

            {/* Public links and Auth buttons */}
            <div className='flex items-center gap-1 sm:gap-4'>
              <NavLink
                to='/destinations'
                className={(state) =>
                  `hidden sm:inline ${publicLinkClass(state)}`
                }
              >
                Destinations
              </NavLink>
              <NavLink to='/explore' className={publicLinkClass}>
                Explore
              </NavLink>
              <NavLink to='/login' className={publicLinkClass}>
                Sign In
              </NavLink>
              <Link
                to='/register'
                className='px-3 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 whitespace-nowrap'
              >
                Get Started
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className='bg-white shadow-sm border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700'
      aria-label='Main navigation'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          {/* Logo and main navigation */}
          <div className='flex items-center'>
            <Link
              to='/trips'
              className='flex items-center rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
              aria-label='Travelo home'
            >
              <span className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                Travelo
              </span>
            </Link>

            {/* Desktop navigation links */}
            <ul className='hidden md:ml-8 md:flex md:space-x-4'>
              {MAIN_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <NavLink to={to} className={desktopLinkClass}>
                    {label}
                  </NavLink>
                </li>
              ))}
              {user?.role === "admin" && (
                <li>
                  <NavLink to='/admin' className={desktopLinkClass}>
                    <Shield size={16} aria-hidden='true' />
                    Admin
                  </NavLink>
                </li>
              )}
            </ul>
          </div>

          {/* Right side - Theme, notifications and user menu */}
          <div className='flex items-center gap-1 sm:gap-3'>
            <ThemeToggle />

            {/* Notification Bell */}
            <NotificationBell />

            {/* User menu */}
            <div
              className='relative'
              ref={userMenuRef}
              onBlur={handleUserMenuBlur}
            >
              <button
                ref={userMenuButtonRef}
                onClick={() => setIsUserMenuOpen((open) => !open)}
                className='flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-800'
                aria-label={`Account menu for ${user?.name || "you"}`}
                aria-expanded={isUserMenuOpen}
                aria-controls='user-menu'
              >
                <Avatar name={user?.name} size='sm' />
                <span
                  className='hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300'
                  aria-hidden='true'
                >
                  {user?.name}
                </span>
              </button>

              {/* User dropdown menu */}
              {isUserMenuOpen && (
                <ul
                  id='user-menu'
                  className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 dark:bg-gray-900 dark:border-gray-700'
                >
                  <li>
                    <Link
                      to='/profile'
                      className={menuItemClass}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User size={16} aria-hidden='true' />
                      Profile
                    </Link>
                  </li>
                  <li className='md:hidden'>
                    <Link
                      to='/notifications'
                      className={menuItemClass}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings size={16} aria-hidden='true' />
                      Notifications
                    </Link>
                  </li>
                  {installApp && (
                    <li>
                      <button
                        type='button'
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          installApp();
                        }}
                        className={menuItemClass}
                      >
                        <Download size={16} aria-hidden='true' />
                        Install app
                      </button>
                    </li>
                  )}
                  <li>
                    <button
                      type='button'
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className='flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 dark:focus:bg-red-950/40'
                    >
                      <LogOut size={16} aria-hidden='true' />
                      Logout
                    </button>
                  </li>
                </ul>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              ref={mobileMenuButtonRef}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className='md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800'
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls='mobile-menu'
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
          id='mobile-menu'
          className='md:hidden border-t border-gray-200 dark:border-gray-700'
        >
          <ul className='px-2 pt-2 pb-3 space-y-1'>
            {MAIN_LINKS.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={mobileLinkClass}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {label}
                </NavLink>
              </li>
            ))}
            {user?.role === "admin" && (
              <li>
                <NavLink
                  to='/admin'
                  className={mobileLinkClass}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin Dashboard
                </NavLink>
              </li>
            )}
            {installApp && (
              <li>
                <button
                  type='button'
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    installApp();
                  }}
                  className='flex w-full items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-300 dark:hover:bg-blue-950/40'
                >
                  <Download size={18} aria-hidden='true' />
                  Install the Travelo app
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
