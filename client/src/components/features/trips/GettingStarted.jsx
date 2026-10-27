import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, X } from "lucide-react";
import { profileApi } from "../../../services/api.service";
import { useTranslation } from "../../../hooks/useTranslation";

const storageKey = (userId) => `travelo:getting-started-hidden:${userId}`;

// localStorage can throw in private windows or when site data is blocked
const readHidden = (userId) => {
  try {
    return localStorage.getItem(storageKey(userId)) === "1";
  } catch {
    return false;
  }
};

const saveHidden = (userId) => {
  try {
    localStorage.setItem(storageKey(userId), "1");
  } catch {
    // Hidden for this visit only
  }
};

const submitted = (verification) =>
  ["pending", "verified"].includes(verification?.status);

/**
 * First-run checklist on the trips page. It disappears once every step is
 * done, or when the user hides it.
 */
const GettingStarted = ({ user, trips, onCreateTrip }) => {
  const { t } = useTranslation();
  const userId = user?.id || user?._id;
  const [hidden, setHidden] = useState(() => readHidden(userId));
  const [twoFactorOn, setTwoFactorOn] = useState(null);

  useEffect(() => {
    if (hidden || !userId) return;
    let active = true;
    profileApi
      .twoFactorStatus()
      .then((status) => active && setTwoFactorOn(Boolean(status?.enabled)))
      .catch(() => active && setTwoFactorOn(false));
    return () => {
      active = false;
    };
  }, [hidden, userId]);

  if (!userId || hidden) return null;

  const steps = [
    {
      id: "email",
      done: Boolean(user.emailVerified),
      label: t("trips.gsEmail"),
      hint: t("trips.gsEmailHint"),
    },
    {
      id: "verify",
      done:
        submitted(user.domesticVerification) ||
        submitted(user.internationalVerification),
      label: t("trips.gsVerify"),
      hint: t("trips.gsVerifyHint"),
      to: "/profile",
    },
    {
      id: "trip",
      done: trips.length > 0,
      label: t("trips.gsTrip"),
      hint: t("trips.gsTripHint"),
      onClick: onCreateTrip,
    },
    {
      id: "invite",
      done: trips.some((trip) => (trip.members?.length || 0) > 1),
      label: t("trips.gsInvite"),
      hint: t("trips.gsInviteHint"),
    },
    {
      id: "secure",
      done: twoFactorOn === true,
      label: t("trips.gsSecure"),
      hint: t("trips.gsSecureHint"),
      to: "/profile",
    },
  ];

  const done = steps.filter((step) => step.done).length;
  // Wait for the 2FA status so the card doesn't flash and vanish
  if (twoFactorOn === null || done === steps.length) return null;

  const hide = () => {
    saveHidden(userId);
    setHidden(true);
  };

  const labelClass =
    "font-medium text-gray-900 dark:text-gray-100";

  return (
    <section
      aria-labelledby='getting-started-title'
      className='mb-6 rounded-xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/40'
    >
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h2
            id='getting-started-title'
            className='text-lg font-semibold text-gray-900 dark:text-gray-100'
          >
            {t("trips.gsTitle")}
          </h2>
          <p className='text-sm text-gray-700 dark:text-gray-300'>
            {t("trips.gsProgress", { done, total: steps.length })}
          </p>
        </div>
        <button
          type='button'
          onClick={hide}
          className='inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:bg-blue-900/60'
        >
          <X className='h-4 w-4' aria-hidden='true' />
          {t("trips.gsHide")}
        </button>
      </div>

      <div
        className='mt-3 h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900'
        role='progressbar'
        aria-label={t("trips.gsTitle")}
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={done}
      >
        <div
          className='h-full rounded-full bg-blue-600 dark:bg-blue-400'
          style={{ width: `${(done / steps.length) * 100}%` }}
        />
      </div>

      <ol className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {steps.map((step) => {
          const Icon = step.done ? CheckCircle2 : Circle;
          let label = <span className={labelClass}>{step.label}</span>;
          if (!step.done && step.to) {
            label = (
              <Link
                to={step.to}
                className={`${labelClass} underline-offset-2 hover:underline`}
              >
                {step.label}
              </Link>
            );
          } else if (!step.done && step.onClick) {
            label = (
              <button
                type='button'
                onClick={step.onClick}
                className={`${labelClass} text-left underline-offset-2 hover:underline`}
              >
                {step.label}
              </button>
            );
          }
          return (
            <li key={step.id} className='flex gap-3'>
              <Icon
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  step.done
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
                aria-hidden='true'
              />
              <div className={step.done ? "opacity-70" : undefined}>
                {label}
                <span className='sr-only'>
                  {step.done ? " (done)" : " (to do)"}
                </span>
                {!step.done && (
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    {step.hint}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default GettingStarted;
