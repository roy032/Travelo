import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { usePageTitle } from "../hooks/usePageTitle";

const LoginPage = () => {
  usePageTitle("Sign in");
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
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
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
            Sign in to your account
          </h1>
          <p className='mt-2 text-center text-sm text-gray-600 dark:text-gray-400'>
            Or{" "}
            <Link
              to='/register'
              className='font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400'
            >
              create a new account
            </Link>
          </p>
        </div>

        <Card>
          <form className='space-y-6' onSubmit={handleSubmit}>
            <Input
              label='Email address'
              type='email'
              name='email'
              value={formData.email}
              onChange={handleChange}
              placeholder='you@example.com'
              error={errors.email}
              required
              autoComplete='email'
            />

            <Input
              label='Password'
              type='password'
              name='password'
              value={formData.password}
              onChange={handleChange}
              placeholder='Enter your password'
              error={errors.password}
              required
              autoComplete='current-password'
            />

            <div className='-mt-3 text-right text-sm'>
              <Link
                to='/forgot-password'
                className='font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400'
              >
                Forgot your password?
              </Link>
            </div>

            <Button
              type='submit'
              variant='primary'
              className='w-full'
              loading={loading}
              disabled={loading}
            >
              Sign in
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
