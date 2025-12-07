import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import Input from './Input';
import Button from './Button';

/**
 * InviteMemberForm component - form to invite members by email
 */
const InviteMemberForm = ({ onInvite, inviting }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate email
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await onInvite(email.trim());
      setEmail(''); // Clear form on success
    } catch (err) {
      // Error handling is done in parent component
      // Keep the email in the form so user can correct it
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email Address"
        type="email"
        name="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError(''); // Clear error on change
        }}
        placeholder="Enter member's email"
        error={error}
        disabled={inviting}
        required
      />

      <Button
        type="submit"
        variant="primary"
        className="w-full flex items-center justify-center gap-2"
        disabled={inviting}
        loading={inviting}
      >
        <UserPlus size={18} />
        Invite Member
      </Button>
    </form>
  );
};

export default InviteMemberForm;
