import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../services/api.service";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { usePageTitle } from "../hooks/usePageTitle";
import { useTranslation } from "../hooks/useTranslation";

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  usePageTitle(t("auth.forgot.pageTitle"));
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError(t("auth.emailRequired"));
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t("auth.emailInvalid"));
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.forgotPassword(email);
      setSentMessage(
        response?.message || t("auth.forgot.sent")
      );
    } catch (err) {
      // Error is already shown by the API service with a toast
      console.error("Forgot password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-950'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h1 className='mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100'>
            {t("auth.forgot.heading")}
          </h1>
          <p className='mt-2 text-center text-sm text-gray-600 dark:text-gray-400'>
            {t("auth.forgot.intro")}
          </p>
        </div>

        <Card>
          {sentMessage ? (
            <div className='space-y-4 text-center' role='status'>
              <p className='text-gray-700 dark:text-gray-300'>{sentMessage}</p>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                {t("auth.forgot.expires")}
              </p>
              <Link
                to='/login'
                className='inline-block font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400'
              >
                {t("auth.backToSignIn")}
              </Link>
            </div>
          ) : (
            <form className='space-y-6' onSubmit={handleSubmit} noValidate>
              <Input
                label={t("auth.email")}
                type='email'
                name='email'
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder={t("auth.emailPlaceholder")}
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
                {t("auth.forgot.submit")}
              </Button>

              <p className='text-center text-sm'>
                <Link
                  to='/login'
                  className='font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400'
                >
                  {t("auth.backToSignIn")}
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
