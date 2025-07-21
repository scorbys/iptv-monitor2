/* eslint-disable react/no-unescaped-entities */

"use client";

import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface Notification {
  show: boolean;
  type: "success" | "error" | "";
  message: string;
}

interface LoginComponentProps {
  onSwitchToRegister: () => void;
}

export const LoginComponent: React.FC<LoginComponentProps> = ({
  onSwitchToRegister,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordTyping, setIsPasswordTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [notification, setNotification] = useState<Notification>({
    show: false,
    type: "",
    message: "",
  });
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<LoginErrors>({});

  const router = useRouter();
  const { login, loginWithGmail } = useAuth();

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: "", message: "" });
    }, 5000);
  };

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    if (field === "password") {
      setIsPasswordTyping(value.length > 0);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        showNotification("success", "Login successful! Redirecting...");
        router.push("/dashboard");
      } else {
        setErrors({ general: result.error || "Login failed" });
        showNotification("error", result.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setErrors({ general: errorMessage });
      showNotification("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGmailLogin = async () => {
    setGmailLoading(true);
    setErrors({});

    try {
      // loginWithGmail sudah melakukan redirect langsung
      // Tidak perlu menangani result karena akan redirect
      loginWithGmail();
    } catch (error) {
      console.error("Gmail login error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Gmail login failed";
      setErrors({ general: errorMessage });
      showNotification("error", errorMessage);
      setGmailLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !loading && !gmailLoading) {
      handleSubmit();
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Image + brightness filter */}
      <div
        className="absolute inset-0 bg-center bg-cover brightness-50"
        style={{
          backgroundImage:
            "url('https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2b/76/b6/aa/public-space.jpg?w=1000&h=-1&s=1')",
          zIndex: 0,
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 z-0" />

      {/* Notification */}
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
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-center text-3xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/80 backdrop-blur-sm py-8 px-6 shadow-xl rounded-2xl border border-white/20">
          <div className="space-y-5">
            {/* Email Field */}
            <div className="group">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-slate-100 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="john@example.com"
                  disabled={loading || gmailLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <XCircle className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="group">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="w-full pl-10 pr-12 py-3 bg-slate-100 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                  disabled={loading || gmailLoading}
                />
                {isPasswordTyping && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 focus:outline-none p-1 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
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

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || gmailLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                  Signing in...
                </div>
              ) : (
                "Sign in"
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center w-full">
              <div className="flex-grow border-t border-black/40" />
              <span className="mx-4 text-sm text-gray-900">or</span>
              <div className="flex-grow border-t border-black/40" />
            </div>

            {/* Gmail Login Button */}
            <button
              type="button"
              onClick={handleGmailLogin}
              disabled={loading || gmailLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {gmailLoading ? (
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
              ) : (
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              {gmailLoading
                ? "Signing in..."
                : "Sign in with Google"}
            </button>

            {/* Switch to Register */}
            <div className="text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 text-gray-500">
                    Don't have an account?
                  </span>
                  <button
                    type="button"
                    onClick={onSwitchToRegister}
                    className="font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-200 hover:underline"
                    disabled={loading || gmailLoading}
                  >
                    Create account
                  </button>
                </div>
              </div>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="rounded-xl bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="ml-3 text-sm text-red-700">{errors.general}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
