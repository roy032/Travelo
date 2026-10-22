import { useState, useEffect } from "react";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import ReceiptUpload from "./ReceiptUpload";
import { currencyApi } from "../../../services/api.service";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  currencyLabel,
  formatMoney,
} from "../../../utils/currency";

const memberId = (member) => member._id || member.id;

const selectClassName =
  "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600";

/**
 * ExpenseForm component - form for creating/editing expenses
 */
const ExpenseForm = ({
  members,
  baseCurrency = DEFAULT_CURRENCY,
  onSubmit,
  onCancel,
  loading,
}) => {
  const [formData, setFormData] = useState({
    amount: "",
    currency: baseCurrency,
    category: "food",
    description: "",
    payer: "",
  });
  // Ids of the members sharing this expense
  const [sharers, setSharers] = useState([]);
  const [receiptFile, setReceiptFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (members && members.length > 0) {
      // Set first member as default payer for new expenses
      setFormData((prev) => ({
        ...prev,
        payer: memberId(members[0]),
      }));
      setSharers(members.map(memberId));
    }
  }, [members]);

  // Show what a foreign amount comes to in the trip currency
  const debouncedAmount = useDebouncedValue(formData.amount, 400);
  useEffect(() => {
    const amount = parseFloat(debouncedAmount);
    if (formData.currency === baseCurrency || !(amount > 0)) {
      setPreview(null);
      return undefined;
    }
    let cancelled = false;
    currencyApi
      .convert(amount, formData.currency, baseCurrency)
      .then((result) => !cancelled && setPreview(result))
      .catch(() => !cancelled && setPreview({ error: true }));
    return () => {
      cancelled = true;
    };
  }, [debouncedAmount, formData.currency, baseCurrency]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const toggleSharer = (id) => {
    setSharers((prev) =>
      prev.includes(id) ? prev.filter((other) => other !== id) : [...prev, id]
    );
    if (errors.splitBetween) {
      setErrors((prev) => ({ ...prev, splitBetween: "" }));
    }
  };

  const handleReceiptChange = (file) => {
    setReceiptFile(file);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.payer) {
      newErrors.payer = "Please select who paid";
    }

    if (members?.length > 0 && sharers.length === 0) {
      newErrors.splitBetween = "Choose at least one person to split with";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const everyone = !members || sharers.length === members.length;
    const submitData = {
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      category: formData.category,
      description: formData.description.trim(),
      payer: formData.payer,
      // An empty list means "everyone", which also covers members who join later
      splitBetween: everyone ? [] : sharers,
    };

    onSubmit(submitData, receiptFile);
  };

  const categories = [
    { value: "food", label: "Food" },
    { value: "transport", label: "Transport" },
    { value: "accommodation", label: "Accommodation" },
    { value: "activities", label: "Activities" },
    { value: "shopping", label: "Shopping" },
    { value: "other", label: "Other" },
  ];

  const shareAmount =
    parseFloat(formData.amount) > 0 && sharers.length > 0
      ? parseFloat(formData.amount) / sharers.length
      : null;

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <Input
          label={`Amount (${formData.currency})`}
          type='number'
          name='amount'
          value={formData.amount}
          onChange={handleChange}
          placeholder='0.00'
          step='0.01'
          min='0.01'
          required
          error={errors.amount}
          className='sm:col-span-2'
          aria-describedby='amount-conversion'
        />

        <div>
          <label
            htmlFor='currency'
            className='block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300'
          >
            Currency
          </label>
          <select
            id='currency'
            name='currency'
            value={formData.currency}
            onChange={handleChange}
            className={selectClassName}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {currencyLabel(code)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p
        id='amount-conversion'
        aria-live='polite'
        className='-mt-2 text-sm text-gray-600 dark:text-gray-400 min-h-5'
      >
        {preview?.error && "Couldn't get an exchange rate right now. The server will convert it when you save."}
        {preview && !preview.error && (
          <>
            ≈ {formatMoney(preview.converted, baseCurrency)} at{" "}
            {preview.rate} {baseCurrency}/{formData.currency}
            {preview.approximate && " (approximate rate)"}
          </>
        )}
      </p>

      <div>
        <label
          htmlFor='category'
          className='block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300'
        >
          Category <span className='text-red-600 ml-1 dark:text-red-400'>*</span>
        </label>
        <select
          id='category'
          name='category'
          value={formData.category}
          onChange={handleChange}
          className={selectClassName}
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <Input
        label='Description'
        type='text'
        name='description'
        value={formData.description}
        onChange={handleChange}
        placeholder='What was this expense for?'
        required
        error={errors.description}
        maxLength={500}
      />

      <div>
        <label
          htmlFor='payer'
          className='block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300'
        >
          Paid By <span className='text-red-600 ml-1 dark:text-red-400'>*</span>
        </label>
        <select
          id='payer'
          name='payer'
          value={formData.payer}
          onChange={handleChange}
          className={selectClassName}
          required
        >
          <option value=''>Select member</option>
          {members &&
            members.map((member) => (
              <option key={memberId(member)} value={memberId(member)}>
                {member.name}
              </option>
            ))}
        </select>
        {errors.payer && (
          <p className='mt-1 text-sm text-red-600 dark:text-red-400'>{errors.payer}</p>
        )}
      </div>

      {members && members.length > 1 && (
        <fieldset aria-describedby='split-hint'>
          <legend className='block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300'>
            Split between
          </legend>
          <p id='split-hint' className='text-xs text-gray-600 mb-2 dark:text-gray-400'>
            {shareAmount !== null
              ? `${formatMoney(shareAmount, formData.currency)} each for ${sharers.length} ${sharers.length === 1 ? "person" : "people"}`
              : "Shared equally between the people you tick"}
          </p>
          <div className='flex flex-wrap gap-2'>
            {members.map((member) => {
              const id = memberId(member);
              const checked = sharers.includes(id);
              return (
                <label
                  key={id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors ${
                    checked
                      ? "bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-950/50 dark:border-blue-700 dark:text-blue-100"
                      : "bg-white border-gray-300 text-gray-700 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-300"
                  }`}
                >
                  <input
                    type='checkbox'
                    checked={checked}
                    onChange={() => toggleSharer(id)}
                    className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600'
                  />
                  {member.name}
                </label>
              );
            })}
          </div>
          {errors.splitBetween && (
            <p className='mt-1 text-sm text-red-600 dark:text-red-400' role='alert'>
              {errors.splitBetween}
            </p>
          )}
        </fieldset>
      )}

      <ReceiptUpload onFileChange={handleReceiptChange} />

      <div className='flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700'>
        <Button
          type='button'
          onClick={onCancel}
          variant='secondary'
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          variant='primary'
          loading={loading}
          disabled={loading}
        >
          Add Expense
        </Button>
      </div>
    </form>
  );
};

export default ExpenseForm;
