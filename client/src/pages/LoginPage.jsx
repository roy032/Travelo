import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { usePageTitle } from "../hooks/usePageTitle";
import { useTranslation } from "../hooks/useTranslation";
import LanguageSelect from "../components/ui/LanguageSelect";

const LoginPage = () => {
  const { t } = useTranslation();
  usePageTitle(t("auth.login.pageTitle"));
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/trips";

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = t("auth.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("auth.emailInvalid");
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t("auth.passwordRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await login(formData);

      navigate(from, { replace: true });
    } catch (error) {
      // Error is already handled by API service with toast
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-950'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h1 className='mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100'>
            {t("auth.login.heading")}
          </h1>
          <p className='mt-2 text-center text-sm text-gray-600 dark:text-gray-400'>
            {t("auth.login.or")}{" "}
            <Link
              to='/register'
              className='font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400'
            >
              {t("auth.login.createAccount")}
            </Link>
          </p>
        </div>

        <Card>
          <form className='space-y-6' onSubmit={handleSubmit}>
            <Input
              label={t("auth.email")}
              type='email'
              name='email'
              value={formData.email}
              onChange={handleChange}
              placeholder={t("auth.emailPlaceholder")}
              error={errors.email}
              required
              autoComplete='email'
            />

            <Input
              label={t("auth.password")}
              type='password'
              name='password'
              value={formData.password}
              onChange={handleChange}
              placeholder={t("auth.login.passwordPlaceholder")}
              error={errors.password}
              required
              autoComplete='current-password'
            />

            <div className='-mt-3 text-right text-sm'>
              <Link
                to='/forgot-password'
                className='font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400'
              >
                {t("auth.login.forgot")}
              </Link>
            </div>

            <Button
              type='submit'
              variant='primary'
              className='w-full'
              loading={loading}
              disabled={loading}
            >
              {t("auth.login.submit")}
            </Button>
          </form>
        </Card>
        {/* Small screens: the navbar has no room for the language picker */}
        <div className='flex justify-center sm:hidden'>
          <LanguageSelect />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
