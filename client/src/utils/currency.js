// Currencies the server can convert (server/src/services/currency.service.js)
export const CURRENCIES = [
  "AED", "AUD", "BDT", "BRL", "CAD", "CHF", "CNY", "DKK", "EUR", "GBP",
  "HKD", "IDR", "INR", "JPY", "KRW", "LKR", "MVR", "MXN", "MYR", "NOK",
  "NPR", "NZD", "PHP", "PKR", "QAR", "SAR", "SEK", "SGD", "THB", "TRY",
  "USD", "VND", "ZAR",
];

export const DEFAULT_CURRENCY = "BDT";

let displayNames;
try {
  displayNames = new Intl.DisplayNames(["en"], { type: "currency" });
} catch {
  displayNames = null;
}

/** "EUR – Euro" for pickers */
export const currencyLabel = (code) => {
  const name = displayNames?.of(code);
  return name && name !== code ? `${code} – ${name}` : code;
};

/**
 * Format an amount with its currency symbol, e.g. ৳1,200.00 or €10.50
 */
export const formatMoney = (amount, currency = DEFAULT_CURRENCY) => {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};
