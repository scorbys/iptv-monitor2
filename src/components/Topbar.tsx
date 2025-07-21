"use client";

import React, { useState, useEffect, useCallback } from "react";
import { IconBell } from "@tabler/icons-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@radix-ui/themes";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Notification {
  id: string | number;
  title: string;
  message: string;
  time: string;
  date: string;
  rawDate: string;
  type: "warning" | "info" | "success";
  deviceName?: string;
  roomNo?: string;
  ipAddr?: string;
  source: "chromecast" | "tv" | "channel" | "system";
}

interface ChromecastDevice {
  idCast?: string;
  deviceName?: string;
  ipAddr?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface TVDevice {
  id?: string;
  roomNo?: string;
  ipAddress?: string;
  status?: string;
  lastChecked?: string;
}

interface Channel {
  id?: string | number;
  channelName?: string;
  ipMulticast?: string;
  status?: string;
  lastChecked?: string;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchOfflineDevices = useCallback(async () => {
    try {
      setLoading(true);
      const notifications: Notification[] = [];

      // Chromecast
      try {
        const res = await fetch("/api/chromecast", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        });
        if (res.ok) {
          const result = await res.json();
          if (result.success && Array.isArray(result.data)) {
            const offline = (result.data as ChromecastDevice[]).filter(
              (d) => !d.isOnline
            );
            offline.forEach((d, i) => {
              const rawDate = d.lastSeen || new Date().toISOString();
              notifications.push({
                id: `chromecast-${d.idCast || i}`,
                title: "Chromecast Device Offline",
                message: `${d.deviceName || "Unknown"} is offline`,
                time: getRelativeTime(rawDate),
                date: formatDate(rawDate),
                rawDate,
                type: "warning",
                deviceName: d.deviceName,
                ipAddr: d.ipAddr,
                source: "chromecast",
              });
            });
          }
        }
      } catch (err) {
        console.error("Chromecast fetch failed", err);
      }

      // TV
      try {
        const res = await fetch("/api/hospitality/tvs", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        });
        if (res.ok) {
          const result = await res.json();
          if (result.success && Array.isArray(result.data)) {
            const offline = (result.data as TVDevice[]).filter(
              (d) => d.status === "offline"
            );
            offline.forEach((d, i) => {
              const rawDate = d.lastChecked || new Date().toISOString();
              notifications.push({
                id: `tv-${d.id || i}`,
                title: "TV Device Offline",
                message: `Room ${d.roomNo || "Unknown"} TV is offline`,
                time: getRelativeTime(rawDate),
                date: formatDate(rawDate),
                rawDate,
                type: "warning",
                roomNo: d.roomNo,
                deviceName: `Room ${d.roomNo}`,
                ipAddr: d.ipAddress,
                source: "tv",
              });
            });
          }
        }
      } catch (err) {
        console.error("TV fetch failed", err);
      }

      // Channel
      try {
        const res = await fetch("/api/channels", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        });
        if (res.ok) {
          const result = await res.json();
          if (result.success && Array.isArray(result.data)) {
            const offline = (result.data as Channel[]).filter(
              (ch) => ch.status === "offline"
            );
            offline.forEach((ch, i) => {
              const rawDate = ch.lastChecked || new Date().toISOString();
              notifications.push({
                id: `channel-${ch.id || i}`,
                title: "Channel Offline",
                message: `${ch.channelName || "Unknown"} is offline`,
                time: getRelativeTime(rawDate),
                date: formatDate(rawDate),
                rawDate,
                type: "warning",
                deviceName: ch.channelName,
                ipAddr: ch.ipMulticast,
                source: "channel",
              });
            });
          }
        }
      } catch (err) {
        console.error("Channel fetch failed", err);
      }

      // Filter & sort ≤ 2 hari
      const now = new Date().getTime();
      const recent = notifications
        .filter(
          (n) => now - new Date(n.rawDate).getTime() <= 2 * 24 * 60 * 60 * 1000
        )
        .sort(
          (a, b) =>
            new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
        );

      if (recent.length > 5) {
        recent.unshift({
          id: "summary",
          title: "Multiple Devices Offline",
          message: `${recent.length} devices are currently offline`,
          time: "Now",
          date: formatDate(new Date().toISOString()),
          rawDate: new Date().toISOString(),
          type: "warning",
          source: "system",
        });
      }

      setNotifications(recent.slice(0, 5));
      localStorage.setItem("offline-notifications", JSON.stringify(recent));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  useEffect(() => {
    const stored = localStorage.getItem("offline-notifications");
    if (stored) {
      const parsed: Notification[] = JSON.parse(stored);
      const now = new Date().getTime();
      const recent = parsed.filter(
        (n) => now - new Date(n.rawDate).getTime() <= 2 * 24 * 60 * 60 * 1000
      );
      setNotifications(recent);
    }
    fetchOfflineDevices();
    const interval = setInterval(fetchOfflineDevices, 120000);
    return () => clearInterval(interval);
  }, [fetchOfflineDevices]);

  const handleViewAllNotifications = () => {
    setNotificationOpen(false);
    router.push("/notifications");
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full h-[60px] bg-sky-900 flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="Logo"
          width={480}
          height={480}
          className="w-25 h-25 object-contain"
        />
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu.Root
          open={notificationOpen}
          onOpenChange={(open) => {
            setNotificationOpen(open);
            if (!open) {
              // Saat dropdown ditutup, tandai semua notifikasi saat ini sebagai sudah dibaca
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
                className="relative p-2 text-white hover:bg-slate-800 rounded-lg"
              >
                <IconBell className="w-5 h-5 text-white" />
                {(() => {
                  const readIds = getReadIds();
                  const unreadCount = notifications.filter(
                    (n) => !readIds.includes(n.id.toString())
                  ).length;

                  return unreadCount > 0 ? (
                    <>
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
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
              className="w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-1 z-50 max-h-96 overflow-y-auto"
              sideOffset={8}
              align="end"
            >
              <div className="px-4 py-3 border-b border-slate-100 bg-blue-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Notifications ({notifications.length})
                </h3>
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
                  <p className="text-sm text-gray-500">No notifications</p>
                  <p className="text-xs text-gray-400 mt-1">
                    All devices are online
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenu.Item key={notification.id} asChild>
                    <div className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                          style={{
                            backgroundColor:
                              notification.source === "tv"
                                ? "#facc15"
                                : notification.source === "chromecast"
                                ? "#38bdf8"
                                : notification.source === "channel"
                                ? "#f87171"
                                : "#94a3b8",
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-tight">
                              {notification.title}
                            </h4>
                            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {notification.date}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-tight">
                            {notification.message}
                          </p>
                          {(notification.deviceName || notification.roomNo) && (
                            <p className="text-xs text-slate-500 mt-1">
                              {notification.source === "tv"
                                ? `Room: ${notification.roomNo}`
                                : notification.source === "channel"
                                ? `Channel: ${notification.deviceName}`
                                : `Device: ${notification.deviceName}`}
                            </p>
                          )}
                          {notification.ipAddr && (
                            <p className="text-xs text-slate-500">
                              IP: {notification.ipAddr}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  </DropdownMenu.Item>
                ))
              )}

              {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={handleViewAllNotifications}
                    className="relative inline-block text-sm text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300 font-medium text-left
               before:content-[''] before:absolute before:bottom-0 before:left-0 before:h-[1.5px] before:w-full before:bg-current
               before:scale-x-0 before:origin-left before:transition-transform before:duration-300 hover:before:scale-x-100"
                  >
                    View all notifications
                  </button>
                </div>
              )}

              <DropdownMenu.Arrow className="fill-white dark:fill-slate-800" />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
