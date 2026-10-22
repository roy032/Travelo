import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { usePageTitle } from "../hooks/usePageTitle";
import { useTranslation } from "../hooks/useTranslation";
import LanguageSelect from "../components/ui/LanguageSelect";

const RegisterPage = () => {
  const { t } = useTranslation();
  usePageTitle(t("auth.register.pageTitle"));
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name) {
      newErrors.name = t("auth.register.nameRequired");
    } else if (formData.name.length < 2) {
      newErrors.name = t("auth.register.nameTooShort");
    } else if (formData.name.length > 100) {
      newErrors.name = t("auth.register.nameTooLong");
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = t("auth.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("auth.emailInvalid");
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t("auth.passwordRequired");
    } else if (formData.password.length < 8) {
      newErrors.password = t("auth.register.passwordTooShort");
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t("auth.register.confirmRequired");
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("auth.register.mismatch");
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
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registrationData } = formData;
      await register(registrationData);
      navigate("/trips", { replace: true });
    } catch (error) {
      // Error is already handled by API service with toast
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-950'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h1 className='mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100'>
            {t("auth.register.heading")}
          </h1>
          <p className='mt-2 text-center text-sm text-gray-600 dark:text-gray-400'>
            {t("auth.register.haveAccount")}{" "}
            <Link
              to='/login'
              className='font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400'
            >
              {t("auth.register.signIn")}
            </Link>
          </p>
        </div>

        <Card>
          <form className='space-y-6' onSubmit={handleSubmit}>
            <Input
              label={t("auth.register.name")}
              type='text'
              name='name'
              value={formData.name}
              onChange={handleChange}
              placeholder={t("auth.register.namePlaceholder")}
              error={errors.name}
              required
              autoComplete='name'
            />

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
              placeholder={t("auth.register.passwordPlaceholder")}
              error={errors.password}
              required
              autoComplete='new-password'
            />

            <Input
              label={t("auth.register.confirmPassword")}
              type='password'
              name='confirmPassword'
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder={t("auth.register.confirmPlaceholder")}
              error={errors.confirmPassword}
              required
              autoComplete='new-password'
            />

            <Button
              type='submit'
              variant='primary'
              className='w-full'
              loading={loading}
              disabled={loading}
            >
              {t("auth.register.submit")}
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

export default RegisterPage;
