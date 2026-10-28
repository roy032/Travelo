import { useState } from "react";
import { Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import { getErrorMessage, plannerApi } from "../../../services/api.service";
import { trackEvent } from "../../../utils/analytics";

const PACES = [
  { value: "relaxed", label: "Relaxed (2-3 a day)" },
  { value: "balanced", label: "Balanced" },
  { value: "packed", label: "Packed (see it all)" },
];

const fieldClass =
  "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600";
const labelClass = "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300";

const activityKey = (date, index) => `${date}-${index}`;

const formatDay = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

const formatCost = (amount, currency) => {
  if (!amount) return "Free";
  if (!currency) return `~${Math.round(amount)}`;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount)} ${currency}`;
  }
};

/**
 * Asks the AI planner for a day-by-day plan and lets the member pick which
 * suggested activities to add to the itinerary
 */
const AiPlannerModal = ({ isOpen, onClose, tripId, trip, onApplied }) => {
  const [form, setForm] = useState({
    destination: "",
    budget: "",
    currency: "USD",
    pace: "balanced",
    interests: "",
    notes: "",
  });
  const [plan, setPlan] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleClose = () => {
    if (loading || applying) return;
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const destination = form.destination.trim();
    if (destination.length < 2) {
      setError("Enter where you're going");
      return;
    }
    const budget = Number(form.budget);
    if (form.budget && !(budget > 0)) {
      setError("Budget must be a positive number");
      return;
    }
    if (form.budget && !/^[A-Za-z]{3}$/.test(form.currency.trim())) {
      setError("Currency must be a 3-letter code, like USD or BDT");
      return;
    }

    setLoading(true);
    try {
      const result = await plannerApi.suggestPlan(tripId, {
        destination,
        ...(form.budget && {
          budget: { amount: budget, currency: form.currency.trim() },
        }),
        pace: form.pace,
        interests: form.interests
          .split(",")
          .map((interest) => interest.trim())
          .filter(Boolean)
          .slice(0, 10),
        notes: form.notes.trim(),
      });
      setPlan(result);
      setSelected(
        new Set(
          result.days.flatMap((day) =>
            day.activities.map((_, index) => activityKey(day.date, index))
          )
        )
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const handleApply = async () => {
    const activities = plan.days.flatMap((day) =>
      day.activities
        .filter((_, index) => selected.has(activityKey(day.date, index)))
        .map(({ estimatedCost, ...activity }) => ({ ...activity, date: day.date }))
    );
    if (activities.length === 0) return;

    setApplying(true);
    try {
      await plannerApi.applyPlan(tripId, activities);
      trackEvent("AI plan applied", { activities: activities.length });
      toast.success(
        `Added ${activities.length} ${activities.length === 1 ? "activity" : "activities"} to the itinerary`
      );
      setPlan(null);
      onApplied?.();
      onClose();
    } catch {
      // The API layer already showed the error
    } finally {
      setApplying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={plan ? "Your suggested plan" : "Plan this trip with AI"}
      size='lg'
    >
      {error && (
        <p
          role='alert'
          className='mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
        >
          {error}
        </p>
      )}

      {!plan ? (
        <form onSubmit={handleSubmit} className='space-y-4' noValidate>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            Get a day-by-day plan for {trip?.title ? `"${trip.title}"` : "this trip"}.
            You choose which suggestions to add, and nothing changes until you do.
          </p>

          <Input
            label='Destination'
            name='planner-destination'
            value={form.destination}
            onChange={update("destination")}
            placeholder='e.g. Sylhet, Bangladesh'
            required
            disabled={loading}
          />

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <div className='sm:col-span-2'>
              <label htmlFor='planner-budget' className={labelClass}>
                Budget per person (optional)
              </label>
              <input
                id='planner-budget'
                type='number'
                min='1'
                inputMode='decimal'
                value={form.budget}
                onChange={update("budget")}
                className={fieldClass}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor='planner-currency' className={labelClass}>
                Currency
              </label>
              <input
                id='planner-currency'
                maxLength={3}
                value={form.currency}
                onChange={update("currency")}
                className={`${fieldClass} uppercase`}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor='planner-pace' className={labelClass}>
              Pace
            </label>
            <select
              id='planner-pace'
              value={form.pace}
              onChange={update("pace")}
              className={fieldClass}
              disabled={loading}
            >
              {PACES.map((pace) => (
                <option key={pace.value} value={pace.value}>
                  {pace.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor='planner-interests' className={labelClass}>
              Interests (comma separated)
            </label>
            <input
              id='planner-interests'
              value={form.interests}
              onChange={update("interests")}
              placeholder='food, hiking, history'
              className={fieldClass}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor='planner-notes' className={labelClass}>
              Anything else? (optional)
            </label>
            <textarea
              id='planner-notes'
              rows={2}
              maxLength={500}
              value={form.notes}
              onChange={update("notes")}
              placeholder='Travelling with kids, no early mornings...'
              className={fieldClass}
              disabled={loading}
            />
          </div>

          {loading && (
            <p className='text-sm text-gray-600 dark:text-gray-400' role='status'>
              Planning your trip. This can take up to a minute.
            </p>
          )}

          <div className='flex justify-end gap-3'>
            <Button variant='outline' onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type='submit' loading={loading}>
              <Sparkles className='mr-2 h-4 w-4' aria-hidden='true' />
              Create plan
            </Button>
          </div>
        </form>
      ) : (
        <div className='space-y-5'>
          {plan.summary && (
            <p className='text-gray-700 dark:text-gray-300'>{plan.summary}</p>
          )}
          {plan.estimatedTotalPerPerson > 0 && (
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Estimated cost per person:{" "}
              <span className='font-semibold text-gray-900 dark:text-gray-100'>
                {formatCost(plan.estimatedTotalPerPerson, plan.currency)}
              </span>
            </p>
          )}

          <div className='max-h-[50vh] space-y-4 overflow-y-auto pr-1'>
            {plan.days.map((day) => (
              <fieldset
                key={day.date}
                className='rounded-lg border border-gray-200 p-3 dark:border-gray-700'
              >
                <legend className='px-1 font-semibold text-gray-900 dark:text-gray-100'>
                  {formatDay(day.date)}
                  {day.theme && (
                    <span className='font-normal text-gray-600 dark:text-gray-400'>
                      {" "}
                      · {day.theme}
                    </span>
                  )}
                </legend>
                {day.activities.length === 0 ? (
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    Free day
                  </p>
                ) : (
                  <ul className='space-y-2'>
                    {day.activities.map((activity, index) => {
                      const key = activityKey(day.date, index);
                      const id = `planner-activity-${key}`;
                      return (
                        <li key={key} className='flex gap-3'>
                          <input
                            id={id}
                            type='checkbox'
                            checked={selected.has(key)}
                            onChange={() => toggle(key)}
                            className='mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800'
                          />
                          <label htmlFor={id} className='flex-1 text-sm'>
                            <span className='font-medium text-gray-900 dark:text-gray-100'>
                              {activity.time} · {activity.title}
                            </span>
                            <span className='block text-gray-600 dark:text-gray-400'>
                              {activity.location.name} ·{" "}
                              {formatCost(activity.estimatedCost, plan.currency)}
                            </span>
                            {activity.description && (
                              <span className='block text-gray-700 dark:text-gray-300'>
                                {activity.description}
                              </span>
                            )}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </fieldset>
            ))}
          </div>

          {plan.tips?.length > 0 && (
            <div>
              <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                Tips
              </h3>
              <ul className='mt-1 list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300'>
                {plan.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <p className='text-xs text-gray-600 dark:text-gray-400'>
            Suggestions are generated by AI. Check opening hours, prices and
            locations before you go.
          </p>

          <div className='flex flex-wrap justify-end gap-3'>
            <Button
              variant='outline'
              onClick={() => setPlan(null)}
              disabled={applying}
            >
              Change details
            </Button>
            <Button
              onClick={handleApply}
              loading={applying}
              disabled={selected.size === 0}
            >
              Add {selected.size} {selected.size === 1 ? "activity" : "activities"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AiPlannerModal;
