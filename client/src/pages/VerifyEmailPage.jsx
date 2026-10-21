import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { authApi } from "../services/api.service";
import { useAuth } from "../hooks/useAuth";
import Card from "../components/ui/Card";
import Loader from "../components/ui/Loader";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { isAuthenticated, updateUser } = useAuth();
  const [status, setStatus] = useState(token ? "verifying" : "error");
  const [message, setMessage] = useState(
    token ? "" : "This confirmation link is incomplete."
  );
  // A link works once, so don't send it twice (StrictMode runs effects twice)
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;

    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus("success");
        updateUser({ emailVerified: true });
      })
      .catch((error) => {
        setStatus("error");
        setMessage(
          error?.message ||
            "This link is invalid or has expired. Please request a new one."
        );
      });
  }, [token, updateUser]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full'>
        <Card>
          {status === "verifying" && (
            <div className='text-center space-y-4' role='status'>
              <Loader />
              <p className='text-gray-700'>Confirming your email address...</p>
            </div>
          )}

          {status === "success" && (
            <div className='text-center space-y-4' role='status'>
              <CheckCircle className='w-12 h-12 text-green-600 mx-auto' aria-hidden='true' />
              <h1 className='text-2xl font-bold text-gray-900'>Email confirmed</h1>
              <p className='text-gray-700'>
                Thanks! You'll now get emails about your trips and join requests.
              </p>
              <Link
                to={isAuthenticated ? "/trips" : "/login"}
                className='inline-block font-medium text-blue-600 hover:text-blue-500'
              >
                {isAuthenticated ? "Go to my trips" : "Sign in"}
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className='text-center space-y-4' role='alert'>
              <XCircle className='w-12 h-12 text-red-600 mx-auto' aria-hidden='true' />
              <h1 className='text-2xl font-bold text-gray-900'>
                We couldn't confirm your email
              </h1>
              <p className='text-gray-700'>{message}</p>
              <p className='text-sm text-gray-500'>
                {isAuthenticated
                  ? "Use the banner at the top of the page to send a new link."
                  : "Sign in to send yourself a new link."}
              </p>
              {!isAuthenticated && (
                <Link
                  to='/login'
                  className='inline-block font-medium text-blue-600 hover:text-blue-500'
                >
                  Sign in
                </Link>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
