import { useState } from "react";
import { Plus } from "lucide-react";
import Button from "../../ui/Button";
import Input from "../../ui/Input";

/**
 * ChecklistAddForm component - form for adding new checklist items
 */
const ChecklistAddForm = ({ onAdd, loading = false }) => {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!text.trim()) {
      setError("Please enter an item");
      return;
    }

    if (text.length > 200) {
      setError("Item must be 200 characters or less");
      return;
    }

    try {
      await onAdd(text.trim());
      setText("");
      setError("");
    } catch (err) {
      setError("Failed to add item");
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    if (error) setError("");
  };

  return (
    <form onSubmit={handleSubmit} className='flex items-start space-x-2'>
      <div className='flex-1'>
        <Input
          type='text'
          name='checklistItem'
          value={text}
          onChange={handleChange}
          placeholder='Add a new item...'
          error={error}
          disabled={loading}
          maxLength={200}
        />
      </div>
      <Button
        type='submit'
        variant='primary'
        size='md'
        loading={loading}
        disabled={!text.trim() || loading}
        className='mt-0'
      >
        <Plus size={20} className='mr-1' />
        Add
      </Button>
    </form>
  );
};

export default ChecklistAddForm;
