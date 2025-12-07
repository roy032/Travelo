import { Link } from 'react-router-dom';
import {
  MapPin,
  Users,
  Calendar,
  DollarSign,
  MessageCircle,
  Camera,
  CheckSquare,
  FileText,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

/**
 * HomePage component
 * Landing page with welcome message and feature highlights
 * Shows different content for authenticated vs unauthenticated users
 */
const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  // Authenticated user view
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Ready to plan your next adventure?
            </p>
            <Link to="/trips">
              <Button variant="primary" size="lg">
                View My Trips
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Link
              to="/trips"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Calendar size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">My Trips</h3>
                  <p className="text-sm text-gray-600">View and manage your trips</p>
                </div>
              </div>
            </Link>

            <Link
              to="/destinations"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <MapPin size={24} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Explore</h3>
                  <p className="text-sm text-gray-600">Discover new destinations</p>
                </div>
              </div>
            </Link>

            <Link
              to="/profile"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Users size={24} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Profile</h3>
                  <p className="text-sm text-gray-600">Manage your account</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Plan Your Perfect Trip
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Collaborate with friends and family to create unforgettable travel experiences.
            Manage itineraries, split expenses, and share memories all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <FeatureCard
            icon={<Calendar size={32} />}
            title="Itinerary Planning"
            description="Create detailed day-by-day schedules with activities and locations"
            color="blue"
          />
          <FeatureCard
            icon={<DollarSign size={32} />}
            title="Expense Tracking"
            description="Log expenses and automatically calculate fair splits among members"
            color="green"
          />
          <FeatureCard
            icon={<MessageCircle size={32} />}
            title="Real-Time Chat"
            description="Stay connected with trip members through instant messaging"
            color="purple"
          />
          <FeatureCard
            icon={<Camera size={32} />}
            title="Photo Gallery"
            description="Share and preserve memories with a collaborative photo gallery"
            color="pink"
          />
          <FeatureCard
            icon={<CheckSquare size={32} />}
            title="Shared Checklist"
            description="Keep track of tasks and packing items with the whole group"
            color="yellow"
          />
          <FeatureCard
            icon={<FileText size={32} />}
            title="Trip Notes"
            description="Create private or shared notes for important information"
            color="indigo"
          />
          <FeatureCard
            icon={<MapPin size={32} />}
            title="Map View"
            description="Visualize your itinerary locations on an interactive map"
            color="red"
          />
          <FeatureCard
            icon={<Users size={32} />}
            title="Collaboration"
            description="Invite friends and family to plan trips together"
            color="teal"
          />
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Start Planning?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who use Travelo to organize their perfect trips.
            Sign up now and start your adventure!
          </p>
          <Link to="/register">
            <Button variant="primary" size="lg">
              Create Free Account
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

/**
 * FeatureCard component
 * Displays a single feature with icon, title, and description
 */
const FeatureCard = ({ icon, title, description, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    pink: 'bg-pink-100 text-pink-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    red: 'bg-red-100 text-red-600',
    teal: 'bg-teal-100 text-teal-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className={`inline-flex p-3 rounded-lg mb-4 ${colorClasses[color]}`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
};

export default HomePage;
