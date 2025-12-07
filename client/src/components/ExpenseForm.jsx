import { useState, useEffect } from "react";
import Input from "./Input";
import Button from "./Button";
import ReceiptUpload from "./ReceiptUpload";

/**
 * ExpenseForm component - form for creating/editing expenses
 */
const ExpenseForm = ({ expense, members, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    amount: "",
    currency: "USD",
    category: "food",
    description: "",
    payer: "",
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [errors, setErrors] = useState({});
  console.log(members);

  useEffect(() => {
    if (members && members.length > 0) {
      // Set first member as default payer for new expenses
      setFormData((prev) => ({
        ...prev,
        payer: members[0]._id || members[0].id,
      }));
    }
  }, [members]);

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

  const handleReceiptChange = (file) => {
    console.log("Receipt file changed:", file);
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData = {
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      category: formData.category,
      description: formData.description.trim(),
      payer: formData.payer,
    };

    console.log("Submitting expense with receipt:", receiptFile);
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

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid grid-cols-2 gap-4'>
        <Input
          label='Amount'
          type='number'
          name='amount'
          value={formData.amount}
          onChange={handleChange}
          placeholder='0.00'
          step='0.01'
          min='0.01'
          required
          error={errors.amount}
        />

        <div>
          <label
            htmlFor='currency'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Currency <span className='text-red-500 ml-1'>*</span>
          </label>
          <select
            id='currency'
            name='currency'
            value={formData.currency}
            onChange={handleChange}
            className='block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            <option value='BDT'>BDT</option>
            <option value='USD'>USD</option>
            <option value='EUR'>EUR</option>
            <option value='GBP'>GBP</option>
            <option value='JPY'>JPY</option>
            <option value='CAD'>CAD</option>
            <option value='AUD'>AUD</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor='category'
          className='block text-sm font-medium text-gray-700 mb-1'
        >
          Category <span className='text-red-500 ml-1'>*</span>
        </label>
        <select
          id='category'
          name='category'
          value={formData.category}
          onChange={handleChange}
          className='block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
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
          className='block text-sm font-medium text-gray-700 mb-1'
        >
          Paid By <span className='text-red-500 ml-1'>*</span>
        </label>
        <select
          id='payer'
          name='payer'
          value={formData.payer}
          onChange={handleChange}
          className='block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          required
        >
          <option value=''>Select member</option>
          {members &&
            members.map((member) => (
              <option
                key={member._id || member.id}
                value={member._id || member.id}
              >
                {member.name}
              </option>
            ))}
        </select>
        {errors.payer && (
          <p className='mt-1 text-sm text-red-600'>{errors.payer}</p>
        )}
      </div>

      <ReceiptUpload onFileChange={handleReceiptChange} />

      <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
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
