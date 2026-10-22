import { useState } from "react";
import { MailWarning } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "../../services/api.service";
import { useAuth } from "../../hooks/useAuth";

/**
 * Reminds signed-in users to confirm their email address, with a resend link
 */
const EmailVerificationBanner = () => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Only when the server says so: older responses may not include the field
  if (!isAuthenticated || user?.emailVerified !== false) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    try {
      const response = await authApi.resendVerification();
      setSent(true);
      toast.success(response?.message || "Confirmation email sent");
    } catch (error) {
      if (error?.data?.error === "Already verified") {
        updateUser({ emailVerified: true });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className='bg-amber-50 border-b border-amber-200' role='region' aria-label='Email confirmation'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-amber-900'>
        <MailWarning className='w-4 h-4 shrink-0' aria-hidden='true' />
        <span>
          Please confirm your email address ({user.email}) to get trip updates
          by email.
        </span>
        {sent ? (
          <span className='font-medium'>Check your inbox for the link.</span>
        ) : (
          <button
            type='button'
            onClick={handleResend}
            disabled={sending}
            className='font-medium underline hover:no-underline disabled:opacity-60'
          >
            {sending ? "Sending..." : "Resend email"}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
