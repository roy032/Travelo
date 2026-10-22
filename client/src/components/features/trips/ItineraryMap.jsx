import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Clock, ExternalLink, MapPin } from "lucide-react";
import {
  formatDay,
  groupByDay,
  hasCoordinates,
  openStreetMapUrl,
  toLatLngs,
} from "../../../utils/itinerary";

// Numbered pin in the day's colour
const stopIcon = (number, color) =>
  L.divIcon({
    className: "",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:${color};color:#fff;font:600 13px/1 system-ui,sans-serif;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">${number}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

const WORLD_VIEW = { center: [20, 0], zoom: 2 };

/**
 * Map of a trip's itinerary: numbered stops in visiting order, a route line
 * for each day and a day filter. Uses free OpenStreetMap tiles.
 */
const ItineraryMap = ({ activities, tripStartDate }) => {
  const days = useMemo(
    () => groupByDay(activities, tripStartDate),
    [activities, tripStartDate]
  );
  const [selectedDay, setSelectedDay] = useState("all");
  const [map, setMap] = useState(null);
  const markerRefs = useRef({});

  const visibleDays =
    selectedDay === "all"
      ? days
      : days.filter((day) => day.key === selectedDay);
  const visiblePoints = visibleDays.flatMap((day) => toLatLngs(day.stops));
  const unmapped = days
    .flatMap((day) => day.stops)
    .filter((stop) => !hasCoordinates(stop)).length;

  // Fit the visible stops whenever the day filter changes
  const boundsKey = JSON.stringify(visiblePoints);
  useEffect(() => {
    if (!map) return;
    const points = JSON.parse(boundsKey);
    if (points.length === 1) {
      map.setView(points[0], 14);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
    }
  }, [map, boundsKey]);

  const showStop = (stop) => {
    if (!map || !hasCoordinates(stop)) return;
    const { lat, lng } = stop.location.coordinates;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 14));
    markerRefs.current[stop.id]?.openPopup();
  };

  if (days.length === 0) {
    return (
      <div className='text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300'>
        <MapPin
          size={48}
          className='mx-auto text-gray-400 mb-4'
          aria-hidden='true'
        />
        <p className='text-gray-600 mb-2'>No activities on the map yet</p>
        <p className='text-sm text-gray-500'>
          Activities added to the itinerary appear here in the order you visit
          them
        </p>
      </div>
    );
  }

  return (
    <div>
      {days.length > 1 && (
        <div
          className='flex flex-wrap gap-2 mb-4'
          role='group'
          aria-label='Show day'
        >
          <button
            type='button'
            onClick={() => setSelectedDay("all")}
            aria-pressed={selectedDay === "all"}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedDay === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All days
          </button>
          {days.map((day) => (
            <button
              key={day.key}
              type='button'
              onClick={() => setSelectedDay(day.key)}
              aria-pressed={selectedDay === day.key}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedDay === day.key
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span
                className='w-2.5 h-2.5 rounded-full'
                style={{ background: day.color }}
                aria-hidden='true'
              />
              Day {day.dayNumber} · {formatDay(day.key)}
            </button>
          ))}
        </div>
      )}

      <div className='rounded-lg overflow-hidden border border-gray-300 shadow-sm'>
        <MapContainer
          ref={setMap}
          center={visiblePoints[0] ?? WORLD_VIEW.center}
          zoom={visiblePoints.length ? 12 : WORLD_VIEW.zoom}
          className='h-[360px] sm:h-[520px] w-full'
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url='https://tile.openstreetmap.org/{z}/{x}/{y}.png'
          />

          {visibleDays.map((day) => {
            const route = toLatLngs(day.stops);
            return (
              <Fragment key={day.key}>
                {route.length > 1 && (
                  <Polyline
                    positions={route}
                    pathOptions={{
                      color: day.color,
                      weight: 3,
                      opacity: 0.8,
                      dashArray: "6 8",
                    }}
                  />
                )}
                {day.stops.filter(hasCoordinates).map((stop) => (
                  <Marker
                    key={stop.id}
                    position={[
                      stop.location.coordinates.lat,
                      stop.location.coordinates.lng,
                    ]}
                    icon={stopIcon(stop.stopNumber, day.color)}
                    title={`${stop.stopNumber}. ${stop.title}`}
                    ref={(marker) => {
                      markerRefs.current[stop.id] = marker;
                    }}
                  >
                    <Popup>
                      <div className='space-y-1'>
                        <p className='font-semibold text-gray-900'>
                          {stop.stopNumber}. {stop.title}
                        </p>
                        <p className='text-sm text-gray-600'>
                          Day {day.dayNumber} · {formatDay(day.key)}
                          {stop.time ? ` at ${stop.time}` : ""}
                        </p>
                        <p className='text-sm text-gray-700'>
                          {stop.location.name}
                        </p>
                        {stop.location.address && (
                          <p className='text-xs text-gray-500'>
                            {stop.location.address}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </Fragment>
            );
          })}
        </MapContainer>
      </div>

      {unmapped > 0 && (
        <p className='mt-2 text-sm text-gray-500'>
          {unmapped} {unmapped === 1 ? "activity has" : "activities have"} no
          map location and {unmapped === 1 ? "is" : "are"} only listed below.
        </p>
      )}

      <ol className='mt-6 space-y-6'>
        {visibleDays.map((day) => (
          <li key={day.key}>
            <h3 className='flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2'>
              <span
                className='w-3 h-3 rounded-full'
                style={{ background: day.color }}
                aria-hidden='true'
              />
              Day {day.dayNumber} · {formatDay(day.key)}
            </h3>
            <ol className='space-y-2'>
              {day.stops.map((stop) => (
                <li
                  key={stop.id}
                  className='flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200'
                >
                  <span
                    className='flex items-center justify-center w-7 h-7 shrink-0 rounded-full text-white text-xs font-semibold'
                    style={{ background: day.color }}
                    aria-hidden='true'
                  >
                    {stop.stopNumber}
                  </span>
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium text-gray-900'>{stop.title}</p>
                    <p className='text-sm text-gray-600 flex flex-wrap items-center gap-x-3'>
                      {stop.time && (
                        <span className='inline-flex items-center gap-1'>
                          <Clock size={14} aria-hidden='true' />
                          {stop.time}
                        </span>
                      )}
                      {stop.location?.name && (
                        <span className='inline-flex items-center gap-1'>
                          <MapPin size={14} aria-hidden='true' />
                          {stop.location.name}
                        </span>
                      )}
                    </p>
                    {stop.description && (
                      <p className='text-sm text-gray-500 mt-1'>
                        {stop.description}
                      </p>
                    )}
                  </div>
                  {hasCoordinates(stop) && (
                    <div className='flex flex-col sm:flex-row gap-2 shrink-0 text-sm'>
                      <button
                        type='button'
                        onClick={() => showStop(stop)}
                        className='text-blue-600 hover:text-blue-700 font-medium'
                        aria-label={`Show ${stop.title} on the map`}
                      >
                        Show
                      </button>
                      <a
                        href={openStreetMapUrl(stop.location.coordinates)}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-1 text-gray-600 hover:text-gray-900'
                        aria-label={`Open ${stop.title} in OpenStreetMap`}
                      >
                        <ExternalLink size={14} aria-hidden='true' />
                        Open
                      </a>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
};

ItineraryMap.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
        .isRequired,
      time: PropTypes.string,
      location: PropTypes.object,
    })
  ).isRequired,
  tripStartDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
  ]),
};

export default ItineraryMap;
