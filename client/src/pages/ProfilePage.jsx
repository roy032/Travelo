import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { profileApi } from "../services/api.service";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import DocumentUpload from "../components/features/admin/DocumentUpload";
import toast from "react-hot-toast";
import { User, Mail, Calendar, Lock, Bell } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";

const ProfilePage = () => {
  usePageTitle("Profile");
  const { user, updateUser } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [notificationsSaving, setNotificationsSaving] = useState(false);

  // Profile validation
  const validateProfile = () => {
    const newErrors = {};

    if (!profileData.name) {
      newErrors.name = "Name is required";
    } else if (profileData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (profileData.name.length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    if (!profileData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = "Email is invalid";
    }

    setProfileErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Password validation
  const validatePassword = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!validateProfile()) {
      return;
    }

    setProfileLoading(true);

    try {
      const emailChanged = profileData.email !== user?.email;
      const response = await profileApi.updateProfile(profileData);
      updateUser(response.user);
      toast.success(
        emailChanged
          ? "Profile updated. Check your new inbox to confirm the address."
          : "Profile updated successfully"
      );
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Profile update error:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleEmailNotificationsChange = async (e) => {
    const enabled = e.target.checked;
    setNotificationsSaving(true);
    try {
      const response = await profileApi.updateProfile({
        emailNotifications: enabled,
      });
      updateUser(response.user);
      toast.success(
        enabled ? "Email notifications turned on" : "Email notifications turned off"
      );
    } catch (error) {
      console.error("Notification setting error:", error);
    } finally {
      setNotificationsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await profileApi.updateProfile({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      // Update user context with the latest user data
      if (response.user) {
        updateUser(response.user);
      }
      toast.success("Password changed successfully");
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Password change error:", error);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelProfileEdit = () => {
    setProfileData({
      name: user?.name || "",
      email: user?.email || "",
    });
    setProfileErrors({});
    setIsEditingProfile(false);
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
    setIsChangingPassword(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8 dark:bg-gray-950'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>Profile Settings</h1>
          <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
            Manage your account information and verification status
          </p>
        </div>

        <div className='space-y-6'>
          {/* Profile Information */}
          <Card>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
                  Profile Information
                </h2>
                {!isEditingProfile && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setIsEditingProfile(true)}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleProfileSubmit} className='space-y-4'>
                  <Input
                    label='Full Name'
                    type='text'
                    name='name'
                    value={profileData.name}
                    onChange={handleProfileChange}
                    error={profileErrors.name}
                    required
                  />

                  <Input
                    label='Email Address'
                    type='email'
                    name='email'
                    value={profileData.email}
                    onChange={handleProfileChange}
                    error={profileErrors.email}
                    required
                  />

                  <div className='flex gap-2'>
                    <Button
                      type='submit'
                      variant='primary'
                      loading={profileLoading}
                      disabled={profileLoading}
                    >
                      Save Changes
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={handleCancelProfileEdit}
                      disabled={profileLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className='space-y-3'>
                  <div className='flex items-center gap-3 text-gray-700 dark:text-gray-300'>
                    <User className='w-5 h-5 text-gray-400' />
                    <div>
                      <p className='text-sm text-gray-500 dark:text-gray-400'>Name</p>
                      <p className='font-medium'>{user?.name}</p>
                    </div>
                  </div>

                  <div className='flex items-center gap-3 text-gray-700 dark:text-gray-300'>
                    <Mail className='w-5 h-5 text-gray-400' />
                    <div>
                      <p className='text-sm text-gray-500 dark:text-gray-400'>Email</p>
                      <p className='font-medium'>
                        {user?.email}
                        {user?.emailVerified === true && (
                          <span className='ml-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300'>
                            Confirmed
                          </span>
                        )}
                        {user?.emailVerified === false && (
                          <span className='ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'>
                            Not confirmed
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-3 text-gray-700 dark:text-gray-300'>
                    <Calendar className='w-5 h-5 text-gray-400' />
                    <div>
                      <p className='text-sm text-gray-500 dark:text-gray-400'>Member Since</p>
                      <p className='font-medium'>
                        {formatDate(user?.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Email notifications */}
          <Card>
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Bell className='w-5 h-5 text-gray-700' aria-hidden='true' />
                <h2 className='text-xl font-semibold text-gray-900'>
                  Email Notifications
                </h2>
              </div>
              <label className='flex items-start gap-3 cursor-pointer'>
                <input
                  type='checkbox'
                  className='mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                  checked={user?.emailNotifications !== false}
                  onChange={handleEmailNotificationsChange}
                  disabled={notificationsSaving}
                />
                <span>
                  <span className='block font-medium text-gray-900'>
                    Email me about my trips
                  </span>
                  <span className='block text-sm text-gray-600'>
                    Join requests, accepted or declined requests and trip
                    invitations. Password reset emails are always sent.
                    {user?.emailVerified === false &&
                      " Confirm your email address to start getting these."}
                  </span>
                </span>
              </label>
            </div>
          </Card>

          {/* Password Change */}
          <Card>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Lock className='w-5 h-5 text-gray-700 dark:text-gray-300' />
                  <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
                    Change Password
                  </h2>
                </div>
                {!isChangingPassword && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setIsChangingPassword(true)}
                  >
                    Change Password
                  </Button>
                )}
              </div>

              {isChangingPassword ? (
                <form onSubmit={handlePasswordSubmit} className='space-y-4'>
                  <Input
                    label='Current Password'
                    type='password'
                    name='currentPassword'
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    error={passwordErrors.currentPassword}
                    required
                    autoComplete='current-password'
                  />

                  <Input
                    label='New Password'
                    type='password'
                    name='newPassword'
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    error={passwordErrors.newPassword}
                    required
                    autoComplete='new-password'
                  />

                  <Input
                    label='Confirm New Password'
                    type='password'
                    name='confirmPassword'
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    error={passwordErrors.confirmPassword}
                    required
                    autoComplete='new-password'
                  />

                  <div className='flex gap-2'>
                    <Button
                      type='submit'
                      variant='primary'
                      loading={passwordLoading}
                      disabled={passwordLoading}
                    >
                      Update Password
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={handleCancelPasswordChange}
                      disabled={passwordLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Keep your account secure by using a strong password
                </p>
              )}
            </div>
          </Card>

          {/* Document Verification */}
          <DocumentUpload />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
