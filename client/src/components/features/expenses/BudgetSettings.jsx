import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Settings2 } from "lucide-react";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import { tripApi } from "../../../services/api.service";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  currencyLabel,
} from "../../../utils/currency";

/**
 * Trip owner's form for the trip currency and budget
 */
const BudgetSettings = ({ trip, onSaved }) => {
  const [currency, setCurrency] = useState(trip.baseCurrency || DEFAULT_CURRENCY);
  const [budget, setBudget] = useState(trip.budget ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCurrency(trip.baseCurrency || DEFAULT_CURRENCY);
    setBudget(trip.budget ?? "");
  }, [trip.baseCurrency, trip.budget]);

  const currencyChanged = currency !== (trip.baseCurrency || DEFAULT_CURRENCY);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = budget === "" ? null : Number(budget);
    if (value !== null && !(value >= 0)) {
      setError("Budget must be zero or more");
      return;
    }
    setError("");

    try {
      setSaving(true);
      const updated = await tripApi.updateTrip(trip.id || trip._id, {
        baseCurrency: currency,
        budget: value,
      });
      toast.success("Budget settings saved");
      onSaved?.(updated);
    } catch (err) {
      console.error("Error saving budget settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4' aria-labelledby='budget-settings-title'>
      <h2
        id='budget-settings-title'
        className='flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100'
      >
        <Settings2 size={20} aria-hidden='true' className='text-gray-600 dark:text-gray-400' />
        Budget settings
      </h2>

      <div>
        <label
          htmlFor='trip-currency'
          className='block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300'
        >
          Trip currency
        </label>
        <select
          id='trip-currency'
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
          className='block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600'
          aria-describedby='trip-currency-hint'
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {currencyLabel(code)}
            </option>
          ))}
        </select>
        <p id='trip-currency-hint' className='mt-1 text-xs text-gray-600 dark:text-gray-400'>
          {currencyChanged
            ? "Saving converts every recorded expense at today's rates."
            : "Totals and balances are shown in this currency."}
        </p>
      </div>

      <Input
        label={`Budget (${currency})`}
        type='number'
        name='trip-budget'
        min='0'
        step='0.01'
        placeholder='No budget'
        value={budget}
        onChange={(event) => setBudget(event.target.value)}
        error={error}
      />

      <Button type='submit' variant='primary' size='sm' loading={saving} disabled={saving}>
        Save
      </Button>
    </form>
  );
};

export default BudgetSettings;
