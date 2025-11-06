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
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "./AuthContext";

const backgroundImages = [
  "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2b/76/b6/aa/public-space.jpg?w=1000&h=-1&s=1",
  "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/12/f1/2d/5a/ocean-view-suite-livingroom.jpg?w=1000&h=-1&s=1",
  "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2b/76/b8/9b/gym-membership-available.jpg?w=1000&h=-1&s=1",
];

interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

interface RegisterErrors {
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

interface RegisterComponentProps {
  onSwitchToLogin: () => void;
}

export const RegisterComponent: React.FC<RegisterComponentProps> = ({
  onSwitchToLogin,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordTyping, setIsPasswordTyping] = useState(false);
  const [isConfirmPasswordTyping, setIsConfirmPasswordTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [notification, setNotification] = useState<Notification>({
    show: false,
    type: "",
    message: "",
  });
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const router = useRouter();
  const { register, loginWithGmail } = useAuth();

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: "", message: "" });
    }, 5000);
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    if (field === "password") {
      setIsPasswordTyping(value.length > 0);
    }
    if (field === "confirmPassword") {
      setIsConfirmPasswordTyping(value.length > 0);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: RegisterErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.username) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters long";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const result = await register(
        formData.username,
        formData.email,
        formData.password
      );

      if (result.success) {
        showNotification(
          "success",
          "Account created successfully! Redirecting..."
        );
        router.push("/dashboard");
      } else {
        setErrors({ general: result.error || "Registration failed" });
        showNotification("error", result.error || "Registration failed");
      }
    } catch (error) {
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
      await loginWithGmail();
      showNotification("success", "Gmail login successful! Redirecting...");
      router.push("/dashboard");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Gmail login failed";
      setErrors({ general: errorMessage });
      showNotification("error", errorMessage);
    } finally {
      setGmailLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !loading && !gmailLoading) {
      handleSubmit();
    }
  };

  // Mengganti gambar latar belakang setiap 4 detik
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % backgroundImages.length
      );
    }, 4000); // Ganti gambar setiap 4 detik

    return () => clearInterval(interval);
  }, []);

  // Style for scrollbar
  <style jsx global>{`
    /* Scrollbar styling */
    .max-h-\[24rem\]::-webkit-scrollbar,
    .max-h-\[28rem\]::-webkit-scrollbar {
      width: 6px;
    }

    .max-h-\[24rem\]::-webkit-scrollbar-track,
    .max-h-\[28rem\]::-webkit-scrollbar-track {
      background: transparent;
      margin: 8px 0;
    }

    .max-h-\[24rem\]::-webkit-scrollbar-thumb,
    .max-h-\[28rem\]::-webkit-scrollbar-thumb {
      background: #e2e8f0;
      border-radius: 3px;
    }

    .max-h-\[24rem\]::-webkit-scrollbar-thumb:hover,
    .max-h-\[28rem\]::-webkit-scrollbar-thumb:hover {
      background: #cbd5e1;
    }

    /* Prevent zoom on iOS */
    @media screen and (-webkit-min-device-pixel-ratio: 0) {
      input[type="email"],
      input[type="password"],
      input[type="text"] {
        font-size: 16px !important;
      }
    }

    /* Ensure focus states are visible */
    input:focus,
    button:focus {
      z-index: 10;
      position: relative;
    }
  `}</style>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-2 sm:p-4 lg:p-6">
      {/* Main Container - Wrapped Card */}
      <div className="w-full max-w-7xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm border border-white/10">
        <div className="flex flex-col lg:flex-row min-h-[500px] sm:min-h-[600px]">
          {/* Left Side Image Slider */}
          <div className="lg:w-1/2 relative overflow-hidden">
            {/* Image Container */}
            <div className="relative w-full h-48 sm:h-64 lg:h-full">
              {backgroundImages.map((image, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${index === currentImageIndex
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-105"
                    }`}
                >
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url('${image}')` }}
                  />
                </div>
              ))}

              {/* Overlay with Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/60" />

              {/* Content Overlay with Animation - Moved to Bottom */}
              <div className="absolute bottom-6 sm:bottom-12 left-0 right-0 text-white z-10 px-4 sm:px-6 lg:px-8">
                <div className="space-y-2 sm:space-y-3 transform transition-all duration-1000">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold leading-tight">
                    <span className="block text-white">Welcome to Our</span>
                    <span className="block text-white/90">Luxury Hotel</span>
                  </h1>
                  <div className="w-12 sm:w-16 h-0.5 bg-white/60 rounded-full"></div>
                  <p className="text-xs sm:text-sm lg:text-base opacity-80 max-w-sm leading-relaxed">
                    Experience luxury and comfort in every moment of your stay
                  </p>
                </div>
              </div>

              {/* Dots Indicator */}
              <div className="absolute bottom-3 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3 z-20">
                {backgroundImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative transition-all duration-300 ${index === currentImageIndex
                      ? "w-6 sm:w-8 h-2 sm:h-3"
                      : "w-2 sm:w-3 h-2 sm:h-3 hover:scale-110"
                      }`}
                  >
                    <div
                      className={`w-full h-full rounded-full transition-all duration-300 ${index === currentImageIndex
                        ? "bg-white shadow-lg"
                        : "bg-white/50 hover:bg-white/75"
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Right Side - Form */}
          <div className="lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12 bg-white relative">
            {/* Notification */}
            {notification.show && (
              <div
                className={`fixed top-6 right-6 z-50 flex items-center space-x-3 px-6 py-4 rounded-2xl shadow-xl backdrop-blur-md transition-all duration-500 transform max-w-sm border ${notification.type === "success"
                  ? "bg-green-50/95 border-green-200 text-green-700"
                  : "bg-red-50/95 border-red-200 text-red-700"
                  }`}
              >
                {notification.type === "success" ? (
                  <CheckCircle className="w-6 h-6 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 flex-shrink-0" />
                )}
                <span className="text-sm font-semibold">
                  {notification.message}
                </span>
              </div>
            )}

            <div
              className="max-w-md w-full relative z-10"
              onKeyPress={handleKeyPress}
            >
              {/* Header - sama persis dengan login */}
              <div className="text-center space-y-3 sm:space-y-4">
                <Image
                  src="/radisson-uluwatu.png"
                  alt="Logo"
                  width={720}
                  height={720}
                  className="mx-auto h-10 sm:h-12 w-auto"
                />
                <h2 className="text-base sm:text-xl font-bold text-gray-900">
                  Sistem Monitoring IPTV & Chromecast
                </h2>
                <div className="w-12 sm:w-16 h-1 bg-blue-600 mx-auto rounded-full"></div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Create Account
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  Join us today and start your journey
                </p>
              </div>

              {/* Form Card dengan fixed height dan scroll internal */}
              <div className="bg-white py-6 sm:py-8 px-6 sm:px-8 relative overflow-visible mt-6 sm:mt-8">
                <div
                  className="relative max-h-[24rem] sm:max-h-[28rem] overflow-y-auto pr-3 sm:pr-4 -mr-3 sm:-mr-4"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#cbd5e1 transparent",
                  }}
                >
                  <div className="space-y-4 sm:space-y-5 py-1">
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
                          <Mail className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                        </div>
                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          className="w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-lg sm:rounded-xl focus:outline-none focus:ring-0 focus:border-blue-500 hover:border-gray-300 transition-all duration-200 text-sm sm:text-base"
                          placeholder="john@example.com"
                          disabled={loading || gmailLoading}
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center">
                          <XCircle className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Username Field */}
                    <div className="group">
                      <label
                        htmlFor="username"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                        </div>
                        <input
                          id="username"
                          type="text"
                          value={formData.username}
                          onChange={(e) =>
                            handleInputChange("username", e.target.value)
                          }
                          className="w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-lg sm:rounded-xl focus:outline-none focus:ring-0 focus:border-blue-500 hover:border-gray-300 transition-all duration-200 text-sm sm:text-base"
                          placeholder="johndoe"
                          disabled={loading || gmailLoading}
                        />
                      </div>
                      {errors.username && (
                        <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center">
                          <XCircle className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                          {errors.username}
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
                          <Lock className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                        </div>
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) =>
                            handleInputChange("password", e.target.value)
                          }
                          className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-lg sm:rounded-xl focus:outline-none focus:ring-0 focus:border-blue-500 hover:border-gray-300 transition-all duration-200 text-sm sm:text-base"
                          placeholder="••••••••"
                          disabled={loading || gmailLoading}
                        />
                        {isPasswordTyping && (
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute top-1/2 right-2 sm:right-3 -translate-y-1/2 focus:outline-none p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 min-h-[36px] sm:min-h-[44px] min-w-[36px] sm:min-w-[44px] flex items-center justify-center"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                            ) : (
                              <Eye className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                            )}
                          </button>
                        )}
                      </div>
                      {errors.password && (
                        <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center">
                          <XCircle className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                          {errors.password}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="group">
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                        </div>
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            handleInputChange("confirmPassword", e.target.value)
                          }
                          className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-lg sm:rounded-xl focus:outline-none focus:ring-0 focus:border-blue-500 hover:border-gray-300 transition-all duration-200 text-sm sm:text-base"
                          placeholder="••••••••"
                          disabled={loading || gmailLoading}
                        />
                        {isConfirmPasswordTyping && (
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute top-1/2 right-2 sm:right-3 -translate-y-1/2 focus:outline-none p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 min-h-[36px] sm:min-h-[44px] min-w-[36px] sm:min-w-[44px] flex items-center justify-center"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                            ) : (
                              <Eye className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                            )}
                          </button>
                        )}
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center">
                          <XCircle className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    {/* General Error */}
                    {errors.general && (
                      <div className="rounded-xl bg-red-50 p-4 border border-red-200">
                        <div className="flex">
                          <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                          <p className="ml-3 text-sm text-red-700">
                            {errors.general}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || gmailLoading}
                        className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-0 focus:border-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg min-h-[44px] sm:min-h-[48px]"
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 sm:h-5 w-4 sm:w-5 text-white" />
                            Signing in...
                          </div>
                        ) : (
                          "Sign up"
                        )}
                      </button>

                      {/* Divider */}
                      <div className="flex items-center w-full my-4 sm:my-6">
                        <div className="flex-grow border-t border-gray-300" />
                        <span className="mx-3 sm:mx-4 text-xs sm:text-sm text-gray-500 font-medium">
                          or
                        </span>
                        <div className="flex-grow border-t border-gray-300" />
                      </div>

                      {/* Gmail Login Button */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleGmailLogin}
                          disabled={loading || gmailLoading}
                          className="w-full flex justify-center items-center py-2.5 sm:py-3 px-4 border border-gray-200 rounded-lg sm:rounded-xl shadow-sm bg-white text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[44px] sm:min-h-[48px]"
                        >
                          {gmailLoading ? (
                            <Loader2 className="animate-spin h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                          ) : (
                            <svg
                              className="w-4 sm:w-5 h-4 sm:h-5 mr-2"
                              viewBox="0 0 24 24"
                            >
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
                            ? "Signing up..."
                            : "Sign up with Google"}
                        </button>

                        {/* Switch to Login */}
                        <div className="text-center pt-2">
                          <div className="flex flex-col sm:flex-row justify-center items-center text-xs sm:text-sm gap-1">
                            <span className="text-gray-600">
                              Already have an account?
                            </span>
                            <button
                              type="button"
                              onClick={onSwitchToLogin}
                              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200 hover:underline px-2 py-1 rounded min-h-[36px] sm:min-h-[44px] flex items-center justify-center"
                              disabled={loading || gmailLoading}
                            >
                              Sign in instead
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};