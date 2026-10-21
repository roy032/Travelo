import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../services/api.service";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Email is invalid");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.forgotPassword(email);
      setSentMessage(
        response?.message ||
          "If an account exists for that email, we've sent a link to reset the password."
      );
    } catch (err) {
      // Error is already shown by the API service with a toast
      console.error("Forgot password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h1 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            Forgot your password?
          </h1>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Enter your email and we'll send you a link to choose a new one.
          </p>
        </div>

        <Card>
          {sentMessage ? (
            <div className='space-y-4 text-center' role='status'>
              <p className='text-gray-700'>{sentMessage}</p>
              <p className='text-sm text-gray-500'>
                The link expires in 60 minutes. Check your spam folder if you
                don't see it.
              </p>
              <Link
                to='/login'
                className='inline-block font-medium text-blue-600 hover:text-blue-500'
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form className='space-y-6' onSubmit={handleSubmit} noValidate>
              <Input
                label='Email address'
                type='email'
                name='email'
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder='you@example.com'
                error={error}
                required
                autoComplete='email'
              />

              <Button
                type='submit'
                variant='primary'
                className='w-full'
                loading={loading}
                disabled={loading}
              >
                Send reset link
              </Button>

              <p className='text-center text-sm'>
                <Link
                  to='/login'
                  className='font-medium text-blue-600 hover:text-blue-500'
                >
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
