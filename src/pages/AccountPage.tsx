"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  IconUser,
  IconMail,
  IconLock,
  IconCamera,
  IconEye,
  IconEyeOff,
  IconCheck,
  IconX,
  IconEdit,
  IconArrowLeft,
} from "@tabler/icons-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  userId: string;
  username: string;
  email: string;
  name?: string;
  avatar?: string;
  provider?: string;
  googleId?: string;
  password?: string | null;
}

interface ValidationResult {
  isValid: boolean;
  message: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);

  // Helper function to get backend URL for avatar
  const getBackendUrl = (path: string) => {
    if (!path) return "";

    // If already a full URL, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // Get backend URL from environment or default to localhost:3001
    const backendUrl = process.env.NEXT_PUBLIC_API_URL ||
                     process.env.NEXT_PUBLIC_API_BASE_URL ||
                     'http://localhost:3001';

    // Remove trailing slash from backend URL
    const baseUrl = backendUrl.replace(/\/$/, '');

    // Remove leading slash from path if exists
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${cleanPath}`;
  };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/auth/verify", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.user) {
            setUser(result.user);
            setFormData({
              username: result.user.username || "",
              name: result.user.name || "",
              email: result.user.email || "",
            });
          }
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const getInitials = (name: string, username: string) => {
    if (name && name.trim()) {
      return name
        .trim()
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return username.slice(0, 2).toUpperCase();
  };

  const validateUsername = (username: string): ValidationResult => {
    if (!username || username.trim().length < 3) {
      return {
        isValid: false,
        message: "Username must be at least 3 characters long",
      };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return {
        isValid: false,
        message: "Username can only contain letters, numbers, and underscores",
      };
    }
    return { isValid: true, message: "" };
  };

  const validatePassword = (password: string): ValidationResult => {
    if (!password || password.length < 6) {
      return {
        isValid: false,
        message: "Password must be at least 6 characters long",
      };
    }
    return { isValid: true, message: "" };
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select a valid image file" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image size must be less than 5MB" });
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/user/avatar", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUser((prev) => (prev ? { ...prev, avatar: result.avatar } : null));
        setMessage({ type: "success", text: "Avatar updated successfully" });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to update avatar",
        });
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      setMessage({ type: "error", text: "Error updating avatar" });
    } finally {
      setSaving(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.username !== user?.username) {
      const usernameValidation = validateUsername(formData.username);
      if (!usernameValidation.isValid) {
        setMessage({ type: "error", text: usernameValidation.message });
        return;
      }
    }

    try {
      setSaving(true);
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          name: formData.name,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUser((prev) => (prev ? { ...prev, ...formData } : null));
        setEditMode(false);
        setMessage({ type: "success", text: "Profile updated successfully" });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to update profile",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Error updating profile" });
    } finally {
      setSaving(false);
    }
  };

  const isValidImageUrl = (url: string): boolean => {
    if (!url) return false;

    if (url.startsWith("data:image/")) return true;

    // Check if it's a valid URL or relative path
    try {
      new URL(url);
      return url.startsWith("http://") || url.startsWith("https://");
    } catch {
      // If URL parsing fails, it might be a relative path
      // Relative paths are considered valid for our use case
      return url.startsWith('/');
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const newPasswordValidation = validatePassword(passwordData.newPassword);
    if (!newPasswordValidation.isValid) {
      setMessage({ type: "error", text: newPasswordValidation.message });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/user/password", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setMessage({ type: "success", text: "Password updated successfully" });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to update password",
        });
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setMessage({ type: "error", text: "Error updating password" });
    } finally {
      setSaving(false);
    }
  };

  const isPasswordFormDisabled = (): boolean => {
    if (saving) return true;
    if (!passwordData.newPassword || !passwordData.confirmPassword) return true;

    const isLocalUser = !user?.provider || user?.provider === "local";

    // Check if user has existing password with better validation
    const hasExistingPassword = user?.password === "exists";
    const requiresCurrentPassword = isLocalUser && hasExistingPassword;

  
    if (requiresCurrentPassword && !passwordData.currentPassword) return true;

    return false;
  };

  const canChangePassword = () => {
    if (!user) return false;

    if (!user.provider || user.provider === "local") {
      return true;
    }

    if (user.provider === "google") {
      return true;
    }

    return false;
  };

  const shouldShowCurrentPasswordField = (): boolean => {
    if (!user) return false;

    const isLocalUser = !user?.provider || user?.provider === "local";
    const hasExistingPassword = user?.password === "exists";

    return isLocalUser && hasExistingPassword;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const clearMessage = useCallback(() => {
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (message) {
      const cleanup = clearMessage();
      return cleanup;
    }
  }, [message, clearMessage]);

  
  const isGoogleUser = user?.provider === "google";
  const canEditProfile = !isGoogleUser || (isGoogleUser && !user?.googleId);
  const passwordChangeAllowed = canChangePassword();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8 sm:pt-16">
        <div className="max-w-4xl mx-auto p-3 sm:p-6">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-32 sm:w-48 mb-4 sm:mb-6"></div>
            <div className="bg-white rounded-lg shadow p-3 sm:p-6">
              <div className="h-24 sm:h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-4xl mx-auto p-3 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <button
            onClick={() => router.back()}
            className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <IconArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Account Settings
          </h1>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${message.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
              }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "success" ? (
                <IconCheck className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              ) : (
                <IconX className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              )}
              <span className="text-sm sm:text-base">{message.text}</span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-4 sm:mb-6">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "profile"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Profile Information
            </button>
            {passwordChangeAllowed && (
              <button
                onClick={() => setActiveTab("security")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "security"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Security
              </button>
            )}
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-lg shadow">
            {/* Avatar Section */}
            <div className="p-3 sm:p-6 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                Profile Picture
              </h2>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="relative flex-shrink-0">
                  {user?.avatar && isValidImageUrl(user.avatar) ? (
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-gray-200">
                      <img
                        src={getBackendUrl(user.avatar)}
                        alt={user.name || user.username}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm sm:text-lg font-medium">
                  ${getInitials(user.name || "", user.username)}
                </div>
              `;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm sm:text-lg font-medium border-2 border-gray-200">
                      {user ? (
                        getInitials(user.name || "", user.username)
                      ) : (
                        <IconUser className="w-6 h-6 sm:w-8 sm:h-8" />
                      )}
                    </div>
                  )}

                  {!isGoogleUser && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={saving}
                      className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 p-1.5 sm:p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors disabled:opacity-50"
                    >
                      <IconCamera className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>

                <div className="text-center sm:text-left">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                    {user?.name || user?.username}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {user?.email}
                  </p>
                  {isGoogleUser && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                      Google Account
                    </span>
                  )}
                  {!isGoogleUser && (
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="hidden sm:inline">
                        Click the camera icon to change your profile picture
                      </span>
                      <span className="sm:hidden">
                        Tap camera to change picture
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Profile Form */}
            <form onSubmit={handleProfileUpdate} className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4">
                <h2 className="text-base sm:text-lg font-medium text-gray-900">
                  Personal Information
                </h2>
                {canEditProfile && !editMode && (
                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="flex items-center justify-center sm:justify-start gap-2 px-3 py-1.5 sm:py-1 text-xs sm:text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    <IconEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                    Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {/* Email Field */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-3 sm:px-4 py-2 pl-8 sm:pl-10 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed text-sm sm:text-base"
                    />
                    <IconMail className="absolute left-2 sm:left-3 top-2.5 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                {/* Username Field */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        handleInputChange("username", e.target.value)
                      }
                      disabled={!canEditProfile || !editMode}
                      className={`w-full px-4 py-2 pl-10 border rounded-md ${!canEditProfile || !editMode
                          ? "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                          : "border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                    />
                    <IconUser className="absolute left-2 sm:left-3 top-2.5 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                  </div>
                  {isGoogleUser && (
                    <p className="text-xs text-gray-500 mt-1">
                      Username cannot be changed for Google accounts
                    </p>
                  )}
                </div>

                {/* Display Name Field */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={!editMode}
                    placeholder="Enter your display name"
                    className={`w-full px-4 py-2 border rounded-md ${!editMode
                        ? "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                        : "border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is how your name will be displayed
                  </p>
                </div>
              </div>

              {editMode && canEditProfile && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 text-sm sm:text-base"
                  >
                    {saving ? (
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <IconCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setFormData({
                        username: user?.username || "",
                        name: user?.name || "",
                        email: user?.email || "",
                      });
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="bg-white rounded-lg shadow">
            {passwordChangeAllowed ? (
              <form onSubmit={handlePasswordUpdate} className="p-3 sm:p-6">
                <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                  Change Password
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                  Update your password to keep your account secure
                </p>

                <div className="space-y-3 sm:space-y-4">
                  {/* Current Password Field */}
                  {shouldShowCurrentPasswordField() && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            handlePasswordChange(
                              "currentPassword",
                              e.target.value
                            )
                          }
                          className="w-full px-3 sm:px-4 py-2 pl-8 sm:pl-10 pr-8 sm:pr-10 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                          required
                        />
                        <IconLock className="absolute left-2 sm:left-3 top-2.5 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                          className="absolute right-2 sm:right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? (
                            <IconEyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                          ) : (
                            <IconEye className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* New Password Field */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      {user?.provider === "google" && !user?.password
                        ? "Set Password"
                        : "New Password"}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          handlePasswordChange("newPassword", e.target.value)
                        }
                        className="w-full px-3 sm:px-4 py-2 pl-8 sm:pl-10 pr-8 sm:pr-10 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        required
                      />
                      <IconLock className="absolute left-2 sm:left-3 top-2.5 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2 sm:right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? (
                          <IconEyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <IconEye className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Must be at least 6 characters long
                    </p>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Confirm{" "}
                      {user?.provider === "google" && !user?.password
                        ? "Password"
                        : "New Password"}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          handlePasswordChange(
                            "confirmPassword",
                            e.target.value
                          )
                        }
                        className="w-full px-3 sm:px-4 py-2 pl-8 sm:pl-10 pr-8 sm:pr-10 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        required
                      />
                      <IconLock className="absolute left-2 sm:left-3 top-2.5 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-2 sm:right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <IconEyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <IconEye className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Google Account Info Box */}
                  {user?.provider === "google" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="flex-shrink-0">
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-blue-800">
                            Google Account
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            {user?.password !== "exists"
                              ? "You can set a password to enable local login in addition to Google sign-in."
                              : "You have set a password for local login. Your Google sign-in will continue to work."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 sm:mt-6">
                  <button
                    type="submit"
                    disabled={isPasswordFormDisabled()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {saving ? (
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <IconLock className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                    {saving
                      ? user?.provider === "google" &&
                        user?.password !== "exists"
                        ? "Setting Password..."
                        : "Updating Password..."
                      : user?.provider === "google" &&
                        user?.password !== "exists"
                        ? "Set Password"
                        : "Update Password"}
                  </button>
                </div>
              </form>
            ) : (
              // Password Not Available Section
              <div className="p-3 sm:p-6 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <IconLock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    Password Management Not Available
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                    Your account is managed through Google. Password changes
                    should be done through your Google account settings.
                  </p>
                  <a
                    href="https://myaccount.google.com/security"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Manage Google Account
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
