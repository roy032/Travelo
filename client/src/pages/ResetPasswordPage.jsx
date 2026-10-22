import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../services/api.service";
import { useAuth } from "../hooks/useAuth";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { checkAuth } = useAuth();

  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await authApi.resetPassword({ token, password: formData.password });
      toast.success("Password reset. Please sign in with your new password.");
      // The server signs this browser out; refresh the auth state to match
      await checkAuth();
      navigate("/login", { replace: true });
    } catch (err) {
      // Error is already shown by the API service with a toast
      console.error("Reset password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <h1 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
          Choose a new password
        </h1>

        <Card>
          {!token ? (
            <div className='space-y-4 text-center' role='alert'>
              <p className='text-gray-700'>
                This reset link is incomplete. Please open the link from your
                email again, or request a new one.
              </p>
              <Link
                to='/forgot-password'
                className='inline-block font-medium text-blue-600 hover:text-blue-500'
              >
                Request a new link
              </Link>
            </div>
          ) : (
            <form className='space-y-6' onSubmit={handleSubmit} noValidate>
              <Input
                label='New password'
                type='password'
                name='password'
                value={formData.password}
                onChange={handleChange}
                placeholder='At least 8 characters'
                error={errors.password}
                required
                autoComplete='new-password'
              />

              <Input
                label='Confirm new password'
                type='password'
                name='confirmPassword'
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder='Type it again'
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
                Reset password
              </Button>

              <p className='text-center text-sm text-gray-600'>
                Link expired?{" "}
                <Link
                  to='/forgot-password'
                  className='font-medium text-blue-600 hover:text-blue-500'
                >
                  Request a new one
                </Link>
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
