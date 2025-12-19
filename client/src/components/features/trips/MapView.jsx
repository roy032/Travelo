import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { MapPin } from "lucide-react";
import Loader from "../../ui/Loader";
import { activityApi } from "../../../services/api.service";
import toast from "react-hot-toast";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in react-leaflet
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

/**
 * MapView component - displays activities with coordinates on a map
 */
const MapView = ({ tripId }) => {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMapData();
  }, [tripId]);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const data = await activityApi.getMapData(tripId);
      setMapData(data);
    } catch (error) {
      console.error("Error fetching map data:", error);
      toast.error("Failed to load map data");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return "";
    if (time.includes(":")) {
      return time;
    }
    const date = new Date(time);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  /**
   * Calculate zoom level based on map bounds
   * Uses the latitude span to determine appropriate zoom level
   */
  const calculateZoom = (bounds) => {
    if (!bounds) return 2;

    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;
    const maxDiff = Math.max(latDiff, lngDiff);

    // Zoom levels based on degree span
    if (maxDiff > 100) return 2;
    if (maxDiff > 50) return 3;
    if (maxDiff > 20) return 4;
    if (maxDiff > 10) return 5;
    if (maxDiff > 5) return 6;
    if (maxDiff > 2) return 7;
    if (maxDiff > 1) return 8;
    if (maxDiff > 0.5) return 9;
    if (maxDiff > 0.2) return 10;
    if (maxDiff > 0.1) return 11;
    if (maxDiff > 0.05) return 12;
    if (maxDiff > 0.02) return 13;
    return 14;
  };

  if (loading) {
    return (
      <div className='flex justify-center py-12'>
        <Loader />
      </div>
    );
  }

  if (!mapData || !mapData.activities || mapData.activities.length === 0) {
    return (
      <div className='text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300'>
        <MapPin size={48} className='mx-auto text-gray-400 mb-4' />
        <p className='text-gray-600 mb-2'>No activities with location data</p>
        <p className='text-sm text-gray-500'>
          Add coordinates to your activities to see them on the map
        </p>
      </div>
    );
  }

  // Calculate center and zoom based on bounds
  const center = mapData.bounds?.center
    ? [mapData.bounds.center.lat, mapData.bounds.center.lng]
    : [0, 0];
  const zoom = calculateZoom(mapData.bounds);

  return (
    <div>
      <div className='mb-4'>
        <h2 className='text-2xl font-bold text-gray-900'>Map View</h2>
        <p className='text-gray-600 mt-1'>
          {mapData.activities.length}{" "}
          {mapData.activities.length === 1 ? "location" : "locations"} on map
        </p>
      </div>

      <div className='rounded-lg overflow-hidden border border-gray-300 shadow-sm'>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: "600px", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />

          {mapData.activities.map((activity) => (
            <Marker
              key={activity._id}
              position={[
                activity.location.coordinates.lat,
                activity.location.coordinates.lng,
              ]}
            >
              <Popup>
                <div className='p-2'>
                  <h3 className='font-semibold text-gray-900 mb-1'>
                    {activity.title}
                  </h3>
                  <p className='text-sm text-gray-600 mb-2'>
                    {formatDate(activity.date)} at {formatTime(activity.time)}
                  </p>
                  <p className='text-sm text-gray-700'>
                    <MapPin size={14} className='inline mr-1' />
                    {activity.location.name}
                  </p>
                  {activity.location.address && (
                    <p className='text-xs text-gray-500 mt-1'>
                      {activity.location.address}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Activity List */}
      <div className='mt-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-3'>
          Activities on Map
        </h3>
        <div className='space-y-2'>
          {mapData.activities.map((activity) => (
            <div
              key={activity._id}
              className='flex items-start p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow'
            >
              <MapPin
                size={20}
                className='text-blue-600 mr-3 mt-0.5 shrink-0'
              />
              <div className='flex-1'>
                <h4 className='font-medium text-gray-900'>{activity.title}</h4>
                <p className='text-sm text-gray-600'>
                  {formatDate(activity.date)} at {formatTime(activity.time)}
                </p>
                <p className='text-sm text-gray-500'>
                  {activity.location.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapView;
