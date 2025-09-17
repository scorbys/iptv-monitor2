"use client";

import React, { useState, useEffect, useCallback } from "react";
import { IconBell, IconSettings } from "@tabler/icons-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@radix-ui/themes";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  Notification,
  fetchAllNotifications,
  cleanOldNotifications,
} from "../app/notifications/notifUtils";

interface NotificationStats {
  totalNotifications: number;
  activeIssues: number;
  recentRecoveries: number;
  last24HourAlerts: number;
}

const getReadIds = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem("read-notif-ids") || "[]");
  } catch {
    return [];
  }
};

const setReadIds = (ids: string[]) => {
  localStorage.setItem("read-notif-ids", JSON.stringify(ids));
};

export default function Topbar() {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({
    username: "Loading...",
    email: "Loading...",
    avatar: null as string | null,
    provider: undefined as string | undefined,
    name: undefined as string | undefined,
  });
  const [userLoading, setUserLoading] = useState(true);
  const router = useRouter();

  // Calculate stats dari notifications
  const calculateStats = useCallback(
    (notifications: Notification[]): NotificationStats => {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const activeIssues = notifications.filter(
        (n) => n.currentStatus === "offline"
      ).length;
      const recentRecoveries = notifications.filter(
        (n) => n.isStatusChange && n.currentStatus === "online"
      ).length;
      const last24HourAlerts = notifications.filter(
        (n) =>
          new Date(n.rawDate) > last24Hours && n.currentStatus === "offline"
      ).length;

      return {
        totalNotifications: notifications.length,
        activeIssues,
        recentRecoveries,
        last24HourAlerts,
      };
    },
    []
  );

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      setUserLoading(true);
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
          console.log("User data from verify API:", result.user); // Debug log

          setUser({
            username: result.user.username,
            email: result.user.email,
            avatar: result.user.avatar || null,
            provider: result.user.provider,
            name: result.user.name, // Pastikan name dari Google ditampilkan
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setUser({
        username: "User",
        email: "user@example.com",
        avatar: null,
        provider: undefined,
        name: undefined,
      });
    } finally {
      setUserLoading(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);

      // Load from cache first
      const cached = localStorage.getItem("notif-cache");
      if (cached) {
        const parsed: Notification[] = JSON.parse(cached);
        const cleaned = cleanOldNotifications(parsed);
        const recent = cleaned.slice(0, 20); // Limit untuk topbar
        setNotifications(recent);
        setStats(calculateStats(recent));
      }

      // Fetch fresh data
      const fresh = await fetchAllNotifications();
      const recent = fresh.slice(0, 20); // Limit untuk topbar
      setNotifications(recent);
      setStats(calculateStats(recent));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  useEffect(() => {
    fetchNotifications();
    fetchUserData();

    // Auto-refresh every 2 minutes untuk topbar
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUserData]);

  const handleViewAllNotifications = () => {
    setNotificationOpen(false);
    router.push("/notifications");
  };

  const handleAccountClick = () => {
    setUserMenuOpen(false);
    router.push("/account");
  };

  // Helper untuk mendapatkan icon berdasarkan source dengan status color
  const getNotificationIcon = (notification: Notification) => {
    const iconClass = "w-3 h-3 flex-shrink-0";
    const isOnline = notification.currentStatus === "online";
    const isRecovered = notification.isStatusChange && isOnline;

    // Base color berdasarkan source
    let baseColor = "";
    switch (notification.source) {
      case "tv":
        baseColor = isRecovered
          ? "bg-yellow-500"
          : isOnline
          ? "bg-green-500"
          : "bg-red-500";
        break;
      case "chromecast":
        baseColor = isRecovered
          ? "bg-blue-500"
          : isOnline
          ? "bg-green-500"
          : "bg-red-500";
        break;
      case "channel":
        baseColor = isRecovered
          ? "bg-purple-500"
          : isOnline
          ? "bg-green-500"
          : "bg-red-500";
        break;
      default:
        baseColor = isRecovered
          ? "bg-gray-500"
          : isOnline
          ? "bg-green-500"
          : "bg-red-500";
        break;
    }

    return (
      <div
        className={`${iconClass} ${baseColor} rounded-full ${
          isRecovered ? "animate-pulse" : ""
        }`}
      />
    );
  };

  // Helper untuk format status
  const getStatusColor = (notification: Notification) => {
    if (
      notification.currentStatus === "online" &&
      notification.isStatusChange
    ) {
      return "text-green-600"; // Recovery
    }
    if (notification.currentStatus === "offline") {
      return "text-red-600"; // Offline
    }
    return "text-gray-600"; // Default
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full h-[80px] bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-lg border-b border-blue-700/30 flex items-center justify-between px-4 sm:px-6 z-50 backdrop-blur-xl">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 via-transparent to-blue-900/50 pointer-events-none" />

      {/* Left Section - Logo and Title dengan glassmorphism effect */}
      <div className="flex items-center gap-4 flex-1 min-w-0 relative z-10">
        <div className="relative">
          <Image
            src="/logo-white.png"
            alt="Logo"
            width={480}
            height={480}
            className="w-20 h-20 sm:w-26 sm:h-26 object-contain flex-shrink-0 filter drop-shadow-lg"
          />
          {/* Logo glow effect */}
          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl opacity-30 animate-pulse" />
        </div>

        {/* Desktop title dengan typography yang lebih menarik */}
        <div className="hidden sm:block">
          <h1 className="text-white text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent drop-shadow-sm">
            Sistem Monitoring IPTV & Chromecast
          </h1>
          <div className="h-0.5 w-24 bg-gradient-to-r from-blue-400 to-transparent mt-1 rounded-full" />
        </div>

        {/* Mobile title - lebih stylish */}
        <div className="block sm:hidden">
          <h1 className="text-white text-base font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            IPTV Monitor
          </h1>
          <div className="h-0.5 w-16 bg-gradient-to-r from-blue-400 to-transparent mt-0.5 rounded-full" />
        </div>
      </div>

      {/* Right Section - User Profile and Notifications dengan glassmorphism */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 relative z-10">
        {/* Notifications dropdown */}
        <DropdownMenu.Root
          open={notificationOpen}
          onOpenChange={(open) => {
            setNotificationOpen(open);
            if (!open) {
              const readIds = notifications.map((n) => n.id.toString());
              setReadIds(readIds);
            }
          }}
        >
          <DropdownMenu.Trigger asChild>
            <div className="relative">
              <Button
                variant="ghost"
                size="2"
                className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/10 hover:border-white/20 group"
              >
                <IconBell className="w-5 h-5 sm:w-6 sm:h-6 text-white transition-transform duration-300 group-hover:scale-110" />
                {(() => {
                  const readIds = getReadIds();
                  const unreadCount = notifications.filter(
                    (n) => !readIds.includes(n.id.toString())
                  ).length;

                  return unreadCount > 0 ? (
                    <>
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></span>
                      <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-lg shadow-red-500/30 animate-bounce">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    </>
                  ) : null;
                })()}
              </Button>
            </div>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="w-96 bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-50 max-h-96 overflow-y-auto"
              sideOffset={8}
              align="end"
            >
              {/* Header dengan stats */}
              <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Notifications ({notifications.length})
                  </h3>
                  {stats && (
                    <div className="flex items-center gap-3 text-xs">
                      {stats.activeIssues > 0 && (
                        <span className="flex items-center gap-1 text-red-600 font-medium">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          {stats.activeIssues} offline
                        </span>
                      )}
                      {stats.recentRecoveries > 0 && (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          {stats.recentRecoveries} recovered
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="px-4 py-8 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">
                    Loading notifications...
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-900 font-medium">
                    All systems running smoothly
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    No issues detected
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenu.Item key={notification.id} asChild>
                    <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                      <div className="flex items-start gap-3">
                        {/* Status indicator */}
                        <div className="flex flex-col items-center gap-1 mt-1">
                          {getNotificationIcon(notification)}
                          {notification.isStatusChange && (
                            <div
                              className={`w-1 h-4 rounded-full transition-colors ${
                                notification.currentStatus === "online"
                                  ? "bg-green-400 shadow-sm shadow-green-400/50"
                                  : "bg-red-400 shadow-sm shadow-red-400/50"
                              }`}
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className={`text-sm font-medium leading-tight ${getStatusColor(
                                notification
                              )}`}
                            >
                              {notification.title}
                            </h4>
                            <span className="text-xs text-slate-500 whitespace-nowrap">
                              {notification.time}
                            </span>
                          </div>

                          <p className="text-sm text-slate-600 mt-1 leading-tight">
                            {notification.message}
                          </p>

                          {/* Device info */}
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            {notification.deviceName && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                {notification.deviceName}
                              </span>
                            )}
                            {notification.currentStatus && (
                              <span
                                className={`px-2 py-1 rounded font-medium ${
                                  notification.currentStatus === "online"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {notification.currentStatus}
                              </span>
                            )}
                          </div>

                          {/* Error category */}
                          {notification.errorCategory && (
                            <div className="mt-1">
                              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                {notification.errorCategory}
                              </span>
                            </div>
                          )}

                          {/* Performance metrics */}
                          {(notification.responseTime ||
                            notification.signalLevel) && (
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              {notification.responseTime && (
                                <span>
                                  Response: {notification.responseTime}ms
                                </span>
                              )}
                              {notification.signalLevel && (
                                <span>Signal: {notification.signalLevel}%</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </DropdownMenu.Item>
                ))
              )}

              {notifications.length > 0 && (
                <div className="px-2 py-2 border-t border-slate-100">
                  <button
                    onClick={handleViewAllNotifications}
                    className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                  >
                    {/* Background animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

                    {/* Button content */}
                    <div className="relative flex items-center justify-center gap-2">
                      <span className="text-sm">View all notifications</span>

                      {/* Animated arrow */}
                      <svg
                        className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>

                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 skew-x-12" />
                  </button>
                </div>
              )}

              <DropdownMenu.Arrow className="fill-white" />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* User Profile - Single Responsive Version */}
        <DropdownMenu.Root open={userMenuOpen} onOpenChange={setUserMenuOpen}>
          <DropdownMenu.Trigger asChild>
            {userLoading ? (
              <div className="flex items-center gap-2 animate-pulse">
                {/* Desktop loading */}
                <div className="hidden sm:flex items-center gap-3 px-3 py-2">
                  <div className="w-8 h-8 bg-slate-700 rounded-full" />
                  <div className="text-left">
                    <div className="h-3 bg-slate-700 rounded w-16 mb-1" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="cursor-pointer">
                {/* Desktop Profile */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 transition-all duration-300 group rounded-xl hover:bg-white/10 backdrop-blur-sm border border-transparent hover:border-white/10">
                  <div className="relative">
                    {user?.avatar ? (
                      <Image
                        src={user.avatar}
                        alt="User Avatar"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full border-2 border-white/30 shadow-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            const initials = user.username
                              .slice(0, 2)
                              .toUpperCase();
                            parent.innerHTML = `
                              <div class="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white/30">
                                <span class="text-white text-xs font-medium">${initials}</span>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white/30">
                        <span className="text-white text-xs font-medium">
                          {user?.username.slice(0, 2).toUpperCase() || "US"}
                        </span>
                      </div>
                    )}
                    {/* Online indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse" />
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-semibold text-white leading-tight group-hover:text-blue-100 transition-colors">
                      {user?.username || "Loading..."}
                    </p>
                  </div>
                </div>

                {/* Mobile Profile */}
                <div className="block sm:hidden relative p-1 rounded-xl hover:bg-white/10 transition-colors">
                  {user?.avatar ? (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/30">
                      <Image
                        src={user.avatar}
                        alt={user.username}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            const initials = user.username
                              .slice(0, 2)
                              .toUpperCase();
                            parent.innerHTML = `
                              <div class="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                                ${initials}
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium border border-white/30 relative">
                      {user?.username.slice(0, 2).toUpperCase() || "US"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="w-72 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-white/20 p-1 z-50"
              sideOffset={8}
              align="end"
            >
              {user && (
                <>
                  <div className="px-4 py-4 border-b border-slate-100/50">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {user.avatar ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shadow-lg">
                            <Image
                              src={user.avatar}
                              alt={user.username}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  const initials = user.username
                                    .slice(0, 2)
                                    .toUpperCase();
                                  parent.innerHTML = `
                                    <div class="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                                      ${initials}
                                    </div>
                                  `;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium border-2 border-white/30 shadow-lg">
                            {user.username.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        {/* Online indicator */}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-semibold text-slate-900">
                          {user.username}
                        </h4>
                        <p className="text-sm text-slate-600">{user.email}</p>
                        {user.provider === "google" && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100text-blue-700 rounded-full">
                              <svg
                                className="w-3 h-3"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                              </svg>
                              Google Account
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-1">
                    <DropdownMenu.Item asChild>
                      <button
                        onClick={handleAccountClick}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100/70 rounded-lg transition-colors text-left group"
                      >
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                          <IconSettings className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <div className="font-medium">Account Settings</div>
                          <div className="text-xs text-slate-500">
                            Manage your profile and preferences
                          </div>
                        </div>
                      </button>
                    </DropdownMenu.Item>
                  </div>
                </>
              )}

              <DropdownMenu.Arrow className="fill-white/95" />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
