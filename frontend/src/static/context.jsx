import React, { createContext, useState, useEffect, useCallback } from "react";

import axiosInstance, { fetchCsrfToken } from "./csrf";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await axiosInstance.get("/auth/me/");

      
      if (response.data.user) {
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      } else {
        throw new Error("No user data in response");
      }
    } catch (err) {
     
      console.log("☁️ Session inactive on server. Clearing local state.");
      setUser(null);
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

 
  const login = async (credentials) => {
    try {
      setError(null);
      
      await fetchCsrfToken();

      const response = await axiosInstance.post("/auth/login/", credentials);

      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        return response.data;
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Invalid credentials";
      setError(msg);
      throw err;
    }
  };

 
  const logout = async () => {
    try {
      await axiosInstance.post("/auth/logout/");
    } catch (err) {
      console.error("Logout failed on server, clearing local anyway", err);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
      
      await fetchCsrfToken();
    }
  };

 
  const register = async (userData) => {
    try {
      setError(null);
      await fetchCsrfToken();
      const response = await axiosInstance.post("/auth/register/", userData);
      
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        return response.data;
      }
    } catch (err) {
      setError(err.response?.data || "Registration failed");
      throw err;
    }
  };

  
  const updateProfile = async (profileData) => {
    try {
      const response = await axiosInstance.put("/profile/update/", profileData);
      if (response.data.success) {
        setUser(response.data.user);
        return response.data;
      }
    } catch (err) {
      setError("Failed to update profile");
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        checkAuthStatus,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};