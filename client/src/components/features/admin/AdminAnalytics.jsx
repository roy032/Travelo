import { useEffect, useState } from "react";
import { AlertTriangle, CalendarRange, UserPlus } from "lucide-react";
import { adminApi } from "../../../services/api.service";
import Card from "../../ui/Card";
import Loader from "../../ui/Loader";

const RANGES = [7, 30, 90];

const CHART_WIDTH = 600;
const CHART_HEIGHT = 140;
const AXIS_GAP = 4;

const formatDay = (isoDate) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/** Bar path with 4px rounded top corners, anchored to the baseline */
const barPath = (x, width, height) => {
  const r = Math.min(4, width / 2, height);
  const top = CHART_HEIGHT - height;
  return `M${x},${CHART_HEIGHT} V${top + r} Q${x},${top} ${x + r},${top} H${
    x + width - r
  } Q${x + width},${top} ${x + width},${top + r} V${CHART_HEIGHT} Z`;
};

/**
 * One single-series daily bar chart. The title names the series, so there
 * is no legend; hovering or focusing a day shows its value.
 */
const DailyBarChart = ({ title, icon: Icon, series, field, total, barClass }) => {
  const [active, setActive] = useState(null);
  const peak = Math.max(0, ...series.map((day) => day[field]));
  const max = Math.max(1, peak);
  const slot = CHART_WIDTH / series.length;
  // 2px gap between neighbouring bars
  const barWidth = Math.max(1, slot - 2);
  const shown = active === null ? null : series[active];

  return (
    <Card padding='lg'>
      <div className='flex items-start justify-between gap-4'>
        <div className='flex items-center gap-2'>
          <Icon className='text-gray-500 dark:text-gray-400' size={18} aria-hidden='true' />
          <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300'>{title}</h3>
        </div>
        <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>{total}</p>
      </div>

      <p
        className='mt-1 h-5 text-xs text-gray-600 dark:text-gray-400'
        aria-live='polite'
      >
        {shown ? `${formatDay(shown.date)}: ${shown[field]}` : `Peak ${peak} per day`}
      </p>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT + AXIS_GAP}`}
        className='mt-2 h-36 w-full'
        preserveAspectRatio='none'
        role='img'
        aria-label={`${title}, daily, ${formatDay(series[0].date)} to ${formatDay(
          series[series.length - 1].date
        )}`}
        onMouseLeave={() => setActive(null)}
      >
        <line
          x1='0'
          x2={CHART_WIDTH}
          y1={CHART_HEIGHT - 0.5}
          y2={CHART_HEIGHT - 0.5}
          className='stroke-gray-300 dark:stroke-gray-700'
          strokeWidth='1'
        />
        {series.map((day, index) => {
          const height = (day[field] / max) * (CHART_HEIGHT - 8);
          const x = index * slot + 1;
          return (
            <g key={day.date} onMouseEnter={() => setActive(index)}>
              {/* Hit target spans the whole column, bigger than the bar */}
              <rect x={index * slot} y='0' width={slot} height={CHART_HEIGHT} fill='transparent' />
              {height > 0 && (
                <path
                  d={barPath(x, barWidth, height)}
                  className={`${barClass} ${
                    active !== null && active !== index ? "opacity-40" : ""
                  }`}
                />
              )}
              <title>{`${formatDay(day.date)}: ${day[field]}`}</title>
            </g>
          );
        })}
      </svg>
      <div className='mt-1 flex justify-between text-xs text-gray-600 dark:text-gray-400'>
        <span>{formatDay(series[0].date)}</span>
        <span>{formatDay(series[series.length - 1].date)}</span>
      </div>
    </Card>
  );
};

/**
 * Admin analytics: daily sign-ups, active trips and server errors
 */
const AdminAnalytics = () => {
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getAnalytics(days)
      .then((data) => {
        if (!cancelled) setAnalytics(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <section aria-labelledby='analytics-heading' className='mb-8'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <h2
          id='analytics-heading'
          className='text-xl font-semibold text-gray-900 dark:text-gray-100'
        >
          Analytics
        </h2>
        <div className='flex gap-1' role='group' aria-label='Date range'>
          {RANGES.map((range) => (
            <button
              key={range}
              type='button'
              onClick={() => {
                setFailed(false);
                setDays(range);
              }}
              aria-pressed={days === range}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                days === range
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {range} days
            </button>
          ))}
        </div>
      </div>

      {failed && (
        <Card>
          <p className='text-sm text-gray-700 dark:text-gray-300'>
            Analytics could not be loaded.
          </p>
        </Card>
      )}

      {!failed && !analytics && (
        <div className='flex justify-center py-8'>
          <Loader />
        </div>
      )}

      {!failed && analytics && (
        <>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
            <DailyBarChart
              title='Sign-ups'
              icon={UserPlus}
              series={analytics.series}
              field='signups'
              total={analytics.totals.signups}
              barClass='fill-blue-600 dark:fill-blue-400'
            />
            <DailyBarChart
              title='Active trips'
              icon={CalendarRange}
              series={analytics.series}
              field='activeTrips'
              total={analytics.totals.activeTripsToday}
              barClass='fill-blue-600 dark:fill-blue-400'
            />
            <DailyBarChart
              title='Server errors'
              icon={AlertTriangle}
              series={analytics.series}
              field='errors'
              total={analytics.totals.errors}
              barClass='fill-red-600 dark:fill-red-400'
            />
          </div>
          <p className='mt-2 text-xs text-gray-600 dark:text-gray-400'>
            Active trips shows trips running today; the other totals cover the
            whole range. Days are in UTC.
          </p>

          <div className='mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <Card padding='lg'>
              <h3 className='mb-3 text-sm font-medium text-gray-700 dark:text-gray-300'>
                Recent server errors
              </h3>
              {analytics.recentErrors.length === 0 ? (
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  No server errors in this range.
                </p>
              ) : (
                <ul className='divide-y divide-gray-200 dark:divide-gray-700'>
                  {analytics.recentErrors.map((error) => (
                    <li key={error.id} className='py-2 text-sm'>
                      <p className='font-mono text-gray-900 dark:text-gray-100'>
                        {error.status} {error.method} {error.path}
                      </p>
                      <p className='text-gray-600 dark:text-gray-400'>
                        {error.message} ·{" "}
                        {new Date(error.createdAt).toLocaleString("en-US")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card padding='lg'>
              <details>
                <summary className='cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Daily numbers as a table
                </summary>
                {/* Focusable so keyboard users can scroll a long range */}
                <div
                  className='mt-3 max-h-64 overflow-y-auto'
                  tabIndex={0}
                  role='region'
                  aria-label='Daily numbers'
                >
                  <table className='w-full text-left text-sm'>
                    <thead className='text-gray-600 dark:text-gray-400'>
                      <tr>
                        <th scope='col' className='py-1 font-medium'>Day</th>
                        <th scope='col' className='py-1 text-right font-medium'>Sign-ups</th>
                        <th scope='col' className='py-1 text-right font-medium'>Active trips</th>
                        <th scope='col' className='py-1 text-right font-medium'>Errors</th>
                      </tr>
                    </thead>
                    <tbody className='text-gray-900 dark:text-gray-100'>
                      {[...analytics.series].reverse().map((day) => (
                        <tr key={day.date} className='border-t border-gray-200 dark:border-gray-700'>
                          <td className='py-1'>{formatDay(day.date)}</td>
                          <td className='py-1 text-right'>{day.signups}</td>
                          <td className='py-1 text-right'>{day.activeTrips}</td>
                          <td className='py-1 text-right'>{day.errors}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </Card>
          </div>
        </>
      )}
    </section>
  );
};

export default AdminAnalytics;
