import { Link } from "react-router-dom";
import {
  MapPin,
  Users,
  Calendar,
  DollarSign,
  MessageCircle,
  Camera,
  CheckSquare,
  FileText,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";
import Hero from "../components/landing/Hero";
import DestinationsGrid from "../components/landing/DestinationsGrid";
import StatsBlock from "../components/landing/StatsBlock";
import JourneySection from "../components/landing/JourneySection";
import CTASection from "../components/landing/CTASection";
import FAQ from "../components/landing/FAQ";
import LandingFooter from "../components/landing/LandingFooter";
import { usePageTitle } from "../hooks/usePageTitle";

/**
 * HomePage component
 * Landing page with welcome message and feature highlights
 * Shows different content for authenticated vs unauthenticated users
 */
const HomePage = () => {
  usePageTitle();
  const { isAuthenticated, user } = useAuth();

  // Authenticated user view
  if (isAuthenticated) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          {/* Welcome Section */}
          <div className='text-center mb-12'>
            <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4 dark:text-gray-100'>
              Welcome back, {user?.name}! 👋
            </h1>
            <p className='text-xl text-gray-600 mb-8 dark:text-gray-400'>
              Ready to plan your next adventure?
            </p>
            <Link to='/trips'>
              <Button variant='primary' size='lg'>
                View My Trips
                <ArrowRight size={20} className='ml-2' />
              </Button>
            </Link>
          </div>

          {/* Quick Actions */}
          <div className='grid md:grid-cols-3 gap-6 mb-12'>
            <Link
              to='/trips'
              className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow dark:bg-gray-900'
            >
              <div className='flex items-center gap-4'>
                <div className='bg-blue-100 p-3 rounded-lg dark:bg-blue-900/40'>
                  <Calendar size={24} className='text-blue-600 dark:text-blue-400' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 dark:text-gray-100'>My Trips</h3>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    View and manage your trips
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to='/explore'
              className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow dark:bg-gray-900'
            >
              <div className='flex items-center gap-4'>
                <div className='bg-green-100 p-3 rounded-lg dark:bg-green-900/40'>
                  <MapPin size={24} className='text-green-700 dark:text-green-300' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 dark:text-gray-100'>Explore</h3>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    Discover trips & destinations
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to='/profile'
              className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow dark:bg-gray-900'
            >
              <div className='flex items-center gap-4'>
                <div className='bg-purple-100 p-3 rounded-lg dark:bg-purple-900/40'>
                  <Users size={24} className='text-purple-600 dark:text-purple-400' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 dark:text-gray-100'>Profile</h3>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>Manage your account</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated user view
  return (
    <div className='min-h-screen'>
      <Hero />
      <DestinationsGrid />
      <StatsBlock />
      <JourneySection />
      <CTASection />
      <FAQ />
      <LandingFooter />
    </div>
  );
};

/**
 * FeatureCard component
 * Displays a single feature with icon, title, and description
 */
const FeatureCard = ({ icon, title, description, color }) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    green: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
    pink: "bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
    teal: "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400",
  };

  return (
    <div className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow dark:bg-gray-900'>
      <div className={`inline-flex p-3 rounded-lg mb-4 ${colorClasses[color]}`}>
        {icon}
      </div>
      <h3 className='text-lg font-semibold text-gray-900 mb-2 dark:text-gray-100'>{title}</h3>
      <p className='text-sm text-gray-600 dark:text-gray-400'>{description}</p>
    </div>
  );
};

export default HomePage;
