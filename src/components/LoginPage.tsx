"use client";

import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Loader2,
  CheckCircle,
  XCircle,
  Building,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { AuthGuard } from "./AuthGuard";

interface FormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

interface Errors {
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

interface Notification {
  show: boolean;
  type: "success" | "error" | "";
  message: string;
}

const LoginPageContent = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordTyping, setIsPasswordTyping] = useState(false);
  const [isConfirmPasswordTyping, setIsConfirmPasswordTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<Notification>({
    show: false,
    type: "",
    message: "",
  });
  const [formData, setFormData] = useState<FormData>({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Errors>({});

  const { login, register } = useAuth();

  const showNotification = (type: "success" | "error", message: string) => {
  setNotification({ show: true, type, message });
  setTimeout(() => {
    setNotification({ show: false, type: "", message: "" });
  }, type === "success" ? 2000 : 5000); // 2 seconds for success, 5 seconds for error
};

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Track typing untuk password fields
    if (field === "password") {
      setIsPasswordTyping(value.length > 0);
    }
    if (field === "confirmPassword") {
      setIsConfirmPasswordTyping(value.length > 0);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Errors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (isSignUp) {
      if (!formData.username) {
        newErrors.username = "Username is required";
      } else if (formData.username.length < 3) {
        newErrors.username = "Username must be at least 3 characters";
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (isSignUp) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
  if (!validateForm()) return;

  setLoading(true);
  setErrors({});

  try {
    if (isSignUp) {
      const result = await register(
        formData.username,
        formData.email,
        formData.password
      );

      if (result.success) {
        showNotification(
          "success",
          "Account created successfully! Please check your email to verify your account."
        );
        // Redirect akan dihandle oleh AuthGuard
      } else {
        setErrors({ general: result.error || "Registration failed" });
        showNotification("error", result.error || "Registration failed");
      }
    } else {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        showNotification("success", "Login successful!");
        // Redirect akan dihandle oleh AuthGuard
      } else {
        setErrors({ general: result.error || "Login failed" });
        showNotification("error", result.error || "Login failed");
      }
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    setErrors({ general: errorMessage });
    showNotification("error", errorMessage);
    console.error("Auth error:", error);
  } finally {
    setLoading(false);
  }
};

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setNotification({ show: false, type: "", message: "" });
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !loading) {
      handleSubmit();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Notification dengan improved positioning */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 left-4 sm:left-auto sm:right-4 sm:w-auto max-w-sm mx-auto sm:mx-0 z-50 flex items-center space-x-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300 transform ${
            notification.type === "success"
              ? "bg-green-50/90 border border-green-200 text-green-700"
              : "bg-red-50/90 border border-red-200 text-red-700"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      <div
        className="max-w-md w-full space-y-6 relative z-10"
        onKeyPress={handleKeyPress}
      >
        {/* Logo and Header dengan improved styling */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
              <Building className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUp
              ? "Join us today and start your journey"
              : "Sign in to access your dashboard"}
          </p>
        </div>

        {/* Form dengan improved styling */}
        <div className="bg-white/80 backdrop-blur-sm py-8 px-6 shadow-xl rounded-2xl border border-white/20">
          <div className="space-y-5">
            {/* Email Field dengan improved styling */}
            <div className="group">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 sm:text-sm hover:border-gray-400"
                  placeholder="john@example.com"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <XCircle className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Username Field (Sign Up Only) dengan improved styling */}
            {isSignUp && (
              <div className="space-y-4">
                {/* Username */}
                <div className="group">
                  <label
                    htmlFor="username"
                    className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        handleInputChange("username", e.target.value)
                      }
                      className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 sm:text-sm hover:border-gray-400"
                      placeholder="johndoe"
                      disabled={loading}
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <XCircle className="w-4 h-4 mr-1" />
                      {errors.username}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Password Field dengan improved styling */}
            <div className="group">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="appearance-none block w-full pl-10 pr-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 sm:text-sm hover:border-gray-400"
                  placeholder="••••••••"
                  disabled={loading}
                />
                {isPasswordTyping && (
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute top-1/2 right-3 -translate-y-1/2 z-20 focus:outline-none p-1 rounded-md hover:bg-gray-100 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                )}
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <XCircle className="w-4 h-4 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password dengan improved styling */}
            {isSignUp && (
              <div className="group">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className="appearance-none block w-full pl-10 pr-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 sm:text-sm hover:border-gray-400"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  {isConfirmPasswordTyping && (
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute top-1/2 right-3 -translate-y-1/2 z-20 focus:outline-none p-1 rounded-md hover:bg-gray-100 transition-colors"
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      )}
                    </button>
                  )}
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <XCircle className="w-4 h-4 mr-1" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* General Error dengan improved styling */}
            {errors.general && (
              <div className="rounded-xl bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{errors.general}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button dengan improved styling */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                    {isSignUp ? "Creating account..." : "Signing in..."}
                  </div>
                ) : (
                  <div className="flex items-center">
                    {isSignUp ? "Create Account" : "Sign In"}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Toggle Mode dengan improved styling */}
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-500">
                {isSignUp
                  ? "Already have an account?"
                  : "Don't have an account?"}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={toggleMode}
              className="font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-200 hover:underline"
              disabled={loading}
            >
              {isSignUp ? "Sign in instead" : "Create account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function IntegratedLoginPage() {
  return (
    <AuthGuard requireAuth={false}>
      <LoginPageContent />
    </AuthGuard>
  );
}
