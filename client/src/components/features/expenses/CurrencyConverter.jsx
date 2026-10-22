import { useEffect, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { currencyApi } from "../../../services/api.service";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  currencyLabel,
  formatMoney,
} from "../../../utils/currency";

const selectClassName =
  "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600";

/**
 * Quick converter between any two supported currencies
 */
const CurrencyConverter = ({ baseCurrency = DEFAULT_CURRENCY }) => {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState(baseCurrency === "USD" ? "EUR" : "USD");
  const [to, setTo] = useState(baseCurrency);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setTo(baseCurrency);
  }, [baseCurrency]);

  const debouncedAmount = useDebouncedValue(amount, 300);

  useEffect(() => {
    const value = parseFloat(debouncedAmount);
    if (!(value >= 0)) {
      setResult(null);
      return undefined;
    }
    let cancelled = false;
    currencyApi
      .convert(value, from, to)
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        setError("");
      })
      .catch(() => {
        if (cancelled) return;
        setResult(null);
        setError("Exchange rates are unavailable right now.");
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedAmount, from, to]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <section aria-labelledby='converter-title' className='space-y-4'>
      <h2
        id='converter-title'
        className='flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100'
      >
        <ArrowLeftRight size={20} aria-hidden='true' className='text-gray-600 dark:text-gray-400' />
        Currency converter
      </h2>

      <div>
        <label htmlFor='convert-amount' className='block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300'>
          Amount
        </label>
        <input
          id='convert-amount'
          type='number'
          min='0'
          step='0.01'
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className={selectClassName}
        />
      </div>

      <div className='grid grid-cols-[1fr_auto_1fr] items-end gap-2'>
        <div>
          <label htmlFor='convert-from' className='block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300'>
            From
          </label>
          <select id='convert-from' value={from} onChange={(e) => setFrom(e.target.value)} className={selectClassName}>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {currencyLabel(code)}
              </option>
            ))}
          </select>
        </div>
        <button
          type='button'
          onClick={swap}
          aria-label='Swap currencies'
          className='mb-0.5 rounded-lg p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-800'
        >
          <ArrowLeftRight size={18} aria-hidden='true' />
        </button>
        <div>
          <label htmlFor='convert-to' className='block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300'>
            To
          </label>
          <select id='convert-to' value={to} onChange={(e) => setTo(e.target.value)} className={selectClassName}>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {currencyLabel(code)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div aria-live='polite' className='min-h-12'>
        {error && <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>}
        {result && (
          <>
            <p className='text-2xl font-bold text-gray-900 dark:text-gray-100' data-testid='converted-amount'>
              {formatMoney(result.converted, result.to)}
            </p>
            <p className='text-xs text-gray-600 dark:text-gray-400'>
              1 {result.from} = {result.rate} {result.to}
              {result.approximate
                ? " · approximate offline rate"
                : result.source !== "identity" && ` · rates from ${result.source}`}
            </p>
          </>
        )}
      </div>
    </section>
  );
};

export default CurrencyConverter;
