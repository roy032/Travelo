import { useState, useEffect } from "react";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import VisibilityToggle from "./VisibilityToggle";

/**
 * NoteEditor component - form for creating/editing notes
 */
const NoteEditor = ({ note, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    visibility: "shared",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || "",
        content: note.content || "",
        visibility: note.visibility || "shared",
      });
    }
  }, [note]);

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

  const handleVisibilityChange = (visibility) => {
    setFormData((prev) => ({
      ...prev,
      visibility,
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.content.trim()) {
      newErrors.content = "Note content is required";
    }

    if (formData.content.length > 10000) {
      newErrors.content = "Note content must be less than 10,000 characters";
    }

    if (formData.title && formData.title.length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting note:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {/* Title input */}
      <Input
        label='Title (optional)'
        type='text'
        name='title'
        value={formData.title}
        onChange={handleChange}
        placeholder='Enter note title'
        error={errors.title}
        disabled={loading}
      />

      {/* Content textarea */}
      <div>
        <label
          htmlFor='content'
          className='block text-sm font-medium text-gray-700 mb-1'
        >
          Content
          <span className='text-red-500 ml-1'>*</span>
        </label>
        <textarea
          id='content'
          name='content'
          value={formData.content}
          onChange={handleChange}
          placeholder='Write your note here...'
          rows={8}
          disabled={loading}
          className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors resize-none ${
            errors.content
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          } ${loading ? "bg-gray-100 cursor-not-allowed" : ""}`}
        />
        {errors.content && (
          <p className='mt-1 text-sm text-red-600'>{errors.content}</p>
        )}
        <p className='mt-1 text-xs text-gray-500'>
          {formData.content.length} / 10,000 characters
        </p>
      </div>

      {/* Visibility toggle */}
      <VisibilityToggle
        visibility={formData.visibility}
        onChange={handleVisibilityChange}
        disabled={loading}
      />

      {/* Action buttons */}
      <div className='flex items-center justify-end space-x-3 pt-4'>
        <Button
          type='button'
          variant='secondary'
          onClick={onCancel}
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
          {note ? "Update Note" : "Create Note"}
        </Button>
      </div>
    </form>
  );
};

export default NoteEditor;
