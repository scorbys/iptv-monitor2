export interface Notification {
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
  idCast?: string | number;
  deviceName?: string;
  ipAddr?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface TVDevice {
  id?: string | number;
  roomNo?: string;
  ipAddress?: string;
  status?: string;
  lastChecked?: string;
}

interface ChannelDevice {
  id?: string | number;
  channelName?: string;
  ipMulticast?: string;
  status?: string;
  lastChecked?: string;
}

// Helper: waktu relatif
export function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

// Helper: format tanggal untuk tampilan
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

// Membuat notifikasi
export function createNotification(
  id: string,
  title: string,
  message: string,
  rawDate: string,
  type: "warning" | "info" | "success",
  source: "tv" | "chromecast" | "channel" | "system",
  extras?: Partial<Notification>
): Notification {
  return {
    id,
    title,
    message,
    rawDate,
    time: getRelativeTime(rawDate),
    date: formatDate(rawDate),
    type,
    source,
    ...extras,
  };
}

// Fetch semua notifikasi dari berbagai sumber
export async function fetchAllNotifications(): Promise<Notification[]> {
  const all: Notification[] = [];

  // Fetch Chromecast
  const chromecastRes = await fetch("/api/chromecast", { credentials: "include" });
  if (chromecastRes.ok) {
    const json = await chromecastRes.json();
    if (json.success && Array.isArray(json.data)) {
      (json.data as ChromecastDevice[])
        .filter((d) => !d.isOnline)
        .forEach((d, i) => {
          const rawDate = d.lastSeen || new Date().toISOString();
          all.push(
            createNotification(
              `chromecast-${d.idCast || i}`,
              "Chromecast Device Offline",
              `${d.deviceName || "Unknown"} is offline`,
              rawDate,
              "warning",
              "chromecast",
              {
                deviceName: d.deviceName,
                ipAddr: d.ipAddr,
              }
            )
          );
        });
    }
  }

  // Fetch TV
  const tvRes = await fetch("/api/hospitality/tvs", { credentials: "include" });
  if (tvRes.ok) {
    const json = await tvRes.json();
    if (json.success && Array.isArray(json.data)) {
      (json.data as TVDevice[])
        .filter((d) => d.status === "offline")
        .forEach((d, i) => {
          const rawDate = d.lastChecked || new Date().toISOString();
          all.push(
            createNotification(
              `tv-${d.id || i}`,
              "TV Device Offline",
              `Room ${d.roomNo || "Unknown"} TV is offline`,
              rawDate,
              "warning",
              "tv",
              {
                roomNo: d.roomNo,
                deviceName: `Room ${d.roomNo}`,
                ipAddr: d.ipAddress,
              }
            )
          );
        });
    }
  }

  // Fetch Channel
  const channelRes = await fetch("/api/channels", { credentials: "include" });
  if (channelRes.ok) {
    const json = await channelRes.json();
    if (json.success && Array.isArray(json.data)) {
      (json.data as ChannelDevice[])
        .filter((ch) => ch.status === "offline")
        .forEach((ch, i) => {
          const rawDate = ch.lastChecked || new Date().toISOString();
          all.push(
            createNotification(
              `channel-${ch.id || i}`,
              "Channel Offline",
              `${ch.channelName || "Unknown"} is offline`,
              rawDate,
              "warning",
              "channel",
              {
                deviceName: ch.channelName,
                ipAddr: ch.ipMulticast,
              }
            )
          );
        });
    }
  }

  const now = Date.now();
  const recentOnly = all
    .filter((n) => now - new Date(n.rawDate).getTime() <= 2 * 86400000)
    .sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  localStorage.setItem("notif-cache", JSON.stringify(recentOnly));
  return recentOnly;
}
