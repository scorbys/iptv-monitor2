"use client";

import React, { useState, useEffect, useRef } from "react";
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
}

interface ValidationResult {
  isValid: boolean;
  message: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  // Profile form states
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
  });

  // Password form states
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // UI states
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

  // Fetch user data
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

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select a valid image file" });
      return;
    }

    // Validate file size (max 5MB)
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
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate username if it's being changed
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

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const clearMessage = () => {
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    if (message) {
      clearMessage();
    }
  }, [message]);

  const isGoogleUser = user?.provider === "google";
  const canEditProfile = !isGoogleUser || (isGoogleUser && !user?.googleId);
  const canChangePassword = user?.provider === "local" || !user?.provider;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6"></div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <IconArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Account Settings
          </h1>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "success" ? (
                <IconCheck className="w-4 h-4" />
              ) : (
                <IconX className="w-4 h-4" />
              )}
              {message.text}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              Profile Information
            </button>
            {canChangePassword && (
              <button
                onClick={() => setActiveTab("security")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "security"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                Security
              </button>
            )}
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {/* Avatar Section */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Profile Picture
              </h2>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {user?.avatar ? (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                      <Image
                        src={user.avatar}
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
                              <div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-medium">
                                ${getInitials(user.name || "", user.username)}
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-medium border-2 border-gray-200 dark:border-gray-600">
                      {user ? (
                        getInitials(user.name || "", user.username)
                      ) : (
                        <IconUser className="w-8 h-8" />
                      )}
                    </div>
                  )}

                  {!isGoogleUser && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={saving}
                      className="absolute -bottom-1 -right-1 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors disabled:opacity-50"
                    >
                      <IconCamera className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {user?.name || user?.username}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                  {isGoogleUser && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                      Google Account
                    </span>
                  )}
                  {!isGoogleUser && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Click the camera icon to change your profile picture
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
            <form onSubmit={handleProfileUpdate} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Personal Information
                </h2>
                {canEditProfile && !editMode && (
                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <IconEdit className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                    <IconMail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                      className={`w-full px-4 py-2 pl-10 border rounded-md ${
                        !canEditProfile || !editMode
                          ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    />
                    <IconUser className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  </div>
                  {isGoogleUser && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Username cannot be changed for Google accounts
                    </p>
                  )}
                </div>

                {/* Display Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={!editMode}
                    placeholder="Enter your display name"
                    className={`w-full px-4 py-2 border rounded-md ${
                      !editMode
                        ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This is how your name will be displayed
                  </p>
                </div>
              </div>

              {editMode && canEditProfile && (
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <IconCheck className="w-4 h-4" />
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
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {canChangePassword ? (
              <form onSubmit={handlePasswordUpdate} className="p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Change Password
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Update your password to keep your account secure
                </p>

                <div className="space-y-4">
                  {/* Current Password - Only show if user has existing password */}
                  {user?.password !== null && user?.provider !== "google" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                          className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        <IconLock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showCurrentPassword ? (
                            <IconEyeOff className="w-4 h-4" />
                          ) : (
                            <IconEye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <IconLock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showNewPassword ? (
                          <IconEyeOff className="w-4 h-4" />
                        ) : (
                          <IconEye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Must be at least 6 characters long
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <IconLock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? (
                          <IconEyeOff className="w-4 h-4" />
                        ) : (
                          <IconEye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Google Account Info */}
                  {user?.provider === "google" && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-blue-600 dark:text-blue-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 1.56c.6 1.11 1.06 2.31 1.38 3.56-1.84.63-3.37 1.91-4.33 3.56.96-1.66 2.49-2.93 4.33-3.56zm1.38-5.12c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56h-2.95zM19.74 10c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                            Google Account
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {!user?.password
                              ? "You can set a password to enable local login in addition to Google sign-in."
                              : "You can update your password for local login. Your Google sign-in will continue to work."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={
                      saving ||
                      !passwordData.newPassword ||
                      !passwordData.confirmPassword ||
                      (user?.password &&
                        user?.provider !== "google" &&
                        !passwordData.currentPassword)
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <IconLock className="w-4 h-4" />
                    )}
                    {saving
                      ? user?.provider === "google" && !user?.password
                        ? "Setting Password..."
                        : "Updating Password..."
                      : user?.provider === "google" && !user?.password
                      ? "Set Password"
                      : "Update Password"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconLock className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Password Management Not Available
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your account is managed through Google. Password changes
                    should be done through your Google account settings.
                  </p>
                  <a
                    href="https://myaccount.google.com/security"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
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
