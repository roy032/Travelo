import { useState, useEffect, useCallback } from "react";
import { authApi, profileApi } from "../services/api.service";
import toast from "react-hot-toast";
import { AuthContext } from "./auth-context";
import { clearOfflineData } from "../utils/offline";
import { trackEvent } from "../utils/analytics";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await profileApi.getProfile({ silent: true });
      setUser(response.user);
      setIsAuthenticated(true);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    const response = await authApi.register(userData);
    trackEvent("Signup");
    await clearOfflineData();

    // Fetch complete user profile data after successful registration
    try {
      const profileResponse = await profileApi.getProfile({ silent: true });
      setUser(profileResponse.user);
      setIsAuthenticated(true);
      toast.success("Registration successful!");
      return profileResponse;
    } catch (error) {
      // Fallback to registration response user data if profile fetch fails
      setUser(response.user);
      setIsAuthenticated(true);
      toast.success("Registration successful!");
      return response;
    }
  };

  // Load the full profile once the server has set the session cookie
  const finishSignIn = async (response) => {
    // Another account may have used this device; drop its saved trips
    await clearOfflineData();
    let result = response;
    try {
      result = await profileApi.getProfile({ silent: true });
      setUser(result.user);
    } catch {
      // Fall back to the sign-in response's user data
      setUser(response.user);
    }
    setIsAuthenticated(true);
    toast.success("Login successful!");
    return result;
  };

  // Resolves with { twoFactorRequired, challenge } when the account needs a
  // code from its authenticator app; completeTwoFactor finishes that sign-in
  const login = async (credentials) => {
    const response = await authApi.login(credentials);
    if (response?.twoFactorRequired) return response;
    return finishSignIn(response);
  };

  const completeTwoFactor = async (data) => {
    const response = await authApi.verifyTwoFactor(data);
    if (response.method === "recovery") {
      toast(
        `Recovery code used. ${response.remainingRecoveryCodes} left; you can make new ones on your profile.`,
        { duration: 8000 }
      );
    }
    return finishSignIn(response);
  };

  const logout = async () => {
    // Saved trips belong to this account; don't leave them on a shared device
    await clearOfflineData();
    try {
      await authApi.logout();
      setUser(null);
      setIsAuthenticated(false);
      toast.success("Logged out successfully");
    } catch {
      // Even if logout fails on server, clear local state
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // The server already ended the session (account deleted, signed out on
  // every device): forget the user and their saved trips locally
  const clearSession = async () => {
    await clearOfflineData();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = useCallback((userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    register,
    login,
    completeTwoFactor,
    logout,
    clearSession,
    updateUser,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
