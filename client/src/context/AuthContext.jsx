import { useState, useEffect, useCallback } from "react";
import { authApi, profileApi } from "../services/api.service";
import toast from "react-hot-toast";
import { AuthContext } from "./auth-context";
import { clearOfflineData } from "../utils/offline";

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

  const login = async (credentials) => {
    const response = await authApi.login(credentials);
    // Another account may have used this device; drop its saved trips
    await clearOfflineData();

    // Fetch complete user profile data after successful login
    try {
      const profileResponse = await profileApi.getProfile({ silent: true });
      setUser(profileResponse.user);
      setIsAuthenticated(true);
      toast.success("Login successful!");

      return profileResponse;
    } catch (error) {
      // Fallback to login response user data if profile fetch fails
      setUser(response.user);
      setIsAuthenticated(true);
      toast.success("Login successful!");

      return response;
    }
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

  const updateUser = useCallback((userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
    updateUser,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
