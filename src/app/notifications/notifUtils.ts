// Interface definitions
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
  error?: string;
  errorCategory?: string;
  previousStatus?: "online" | "offline";
  currentStatus?: "online" | "offline";
  isStatusChange?: boolean;
  responseTime?: number;
  signalLevel?: number;
  suggestedSolutions?: string[];
}

interface ChromecastDevice {
  idCast?: string | number;
  deviceName?: string;
  ipAddr?: string;
  isOnline?: boolean;
  lastSeen?: string;
  error?: string;
  responseTime?: number;
  signalLevel?: number;
}

interface TVDevice {
  id?: string | number;
  roomNo?: string;
  ipAddress?: string;
  status?: string;
  lastChecked?: string;
  error?: string;
  responseTime?: number;
  signalLevel?: number;
  model?: string;
}

interface ChannelDevice {
  id?: string | number;
  channelName?: string;
  ipMulticast?: string;
  status?: string;
  lastChecked?: string;
  error?: string;
  responseTime?: number;
  signalLevel?: number;
}

interface FetchSource {
  name: string;
  url: string;
  processor: (data: unknown[]) => void;
}

// Error categorization system
export function getErrorCategory(error?: string, status?: string): string {
  if (!error && status === "offline") return "Connection";
  if (!error) return "Unknown";

  const errorLower = error.toLowerCase();

  // Network/Connection issues
  if (
    errorLower.includes("network") ||
    errorLower.includes("connection") ||
    errorLower.includes("timeout") ||
    errorLower.includes("connection_failure") ||
    errorLower.includes("weak signal") ||
    errorLower.includes("no signal")
  ) {
    return "Network";
  }

  // Power/Hardware issues
  if (
    errorLower.includes("power") ||
    errorLower.includes("boot") ||
    errorLower.includes("adaptor") ||
    errorLower.includes("black screen") ||
    errorLower.includes("no device found")
  ) {
    return "Power";
  }

  // HDMI/Display/Signal issues
  if (
    errorLower.includes("hdmi") ||
    errorLower.includes("signal") ||
    errorLower.includes("display") ||
    errorLower.includes("unplug lan") ||
    errorLower.includes("lan out") ||
    errorLower.includes("lan in")
  ) {
    return "Display";
  }

  // Authentication/Setup issues
  if (
    errorLower.includes("authentication") ||
    errorLower.includes("login") ||
    errorLower.includes("credential") ||
    errorLower.includes("setup") ||
    errorLower.includes("white list") ||
    errorLower.includes("local network")
  ) {
    return "Authentication";
  }

  // Configuration issues
  if (
    errorLower.includes("configuration") ||
    errorLower.includes("setting") ||
    errorLower.includes("widget") ||
    errorLower.includes("hbrowser") ||
    errorLower.includes("ip conflict")
  ) {
    return "Configuration";
  }

  // Channel/Stream specific errors
  if (
    errorLower.includes("channel") ||
    errorLower.includes("playing") ||
    errorLower.includes("player") ||
    errorLower.includes("stream") ||
    errorLower.includes("biznet") ||
    errorLower.includes("vlc")
  ) {
    return "Channel";
  }

  // Device/Hardware specific
  if (
    errorLower.includes("hardware") ||
    errorLower.includes("device") ||
    (errorLower.includes("chromecast") && errorLower.includes("rusak"))
  ) {
    return "Hardware";
  }

  return "System";
}

// Solution suggestion system
export function getSuggestedSolutions(
  error?: string,
  deviceSource?: string,
  errorCategory?: string
): string[] {
  if (!error && !errorCategory) return [];

  const errorLower = error?.toLowerCase() || "";
  const solutions: string[] = [];

  // Device-specific solutions
  switch (deviceSource) {
    case "chromecast":
      solutions.push(...getChromecastSolutions(errorLower, errorCategory));
      break;
    case "tv":
      solutions.push(...getTVSolutions(errorLower, errorCategory));
      break;
    case "channel":
      solutions.push(...getChannelSolutions(errorLower, errorCategory));
      break;
  }

  // Generic solutions if no device-specific solutions found
  if (solutions.length === 0) {
    solutions.push(...getGenericSolutions(errorCategory));
  }

  return solutions;
}

// Device-specific solution helpers
function getChromecastSolutions(
  errorLower: string,
  errorCategory?: string
): string[] {
  const solutions: string[] = [];

  if (
    errorLower.includes("no device found") ||
    errorCategory === "Authentication"
  ) {
    solutions.push(
      "Deactive White list profile",
      "Restart Chromecast & WIFI",
      "Radisson Guest Must Be Login"
    );
  }

  if (errorLower.includes("black screen") || errorCategory === "Power") {
    solutions.push("Check Adaptor Chromecast", "Reset Chromecast Power");
  }

  if (errorLower.includes("setup") || errorLower.includes("ios")) {
    solutions.push(
      "Install Google Home app",
      "Allow local network access pada iPhone"
    );
  }

  if (errorCategory === "Configuration") {
    solutions.push(
      "Reset Configuration",
      "Restart Chromecast dibawa ke ruang server"
    );
  }

  return solutions;
}

function getTVSolutions(errorLower: string, errorCategory?: string): string[] {
  const solutions: string[] = [];

  if (errorLower.includes("weak") || errorLower.includes("no signal")) {
    solutions.push(
      "Periksa koneksi LAN pada TV",
      "Pastikan sumber HDMI diatur ke HDMI-1"
    );
  }

  if (errorLower.includes("unplug") || errorLower.includes("lan")) {
    solutions.push(
      "Periksa koneksi LAN (pastikan terpasang di LAN IN)",
      "Posisikan kabel LAN dengan benar"
    );
  }

  if (errorCategory === "Power") {
    solutions.push(
      "Restart perangkat IPTV",
      "Periksa indikator LED pada box IPTV"
    );
  }

  return solutions;
}

function getChannelSolutions(
  errorLower: string,
  errorCategory?: string
): string[] {
  const solutions: string[] = [];

  if (errorLower.includes("playing") || errorLower.includes("player")) {
    solutions.push("Channel issue dari Biznet (Testing VIA VLC)");
  }

  if (errorLower.includes("connection") || errorCategory === "Network") {
    solutions.push(
      "Reinstall Widget Solution",
      "Reload IGCMP",
      "Check IP conflict"
    );
  }

  if (errorLower.includes("not found")) {
    solutions.push("LAN Out Terpasang bukan LAN In");
  }

  return solutions;
}

function getGenericSolutions(errorCategory?: string): string[] {
  switch (errorCategory) {
    case "Network":
      return [
        "Check network connection",
        "Restart network equipment",
        "Verify IP configuration",
      ];
    case "Power":
      return [
        "Check power supply",
        "Restart device",
        "Verify power connections",
      ];
    case "Authentication":
      return [
        "Check login credentials",
        "Verify network access",
        "Reset authentication",
      ];
    case "Configuration":
      return [
        "Check device settings",
        "Reset configuration",
        "Verify setup parameters",
      ];
    default:
      return [];
  }
}

// Time and date utilities
export function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

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

// Status change tracking
function checkStatusChange(
  deviceId: string,
  currentStatus: string
): { previousStatus?: string; isStatusChange: boolean } {
  try {
    const cached = localStorage.getItem("device-status-cache");
    const statusCache = cached ? JSON.parse(cached) : {};
    const previousStatus = statusCache[deviceId];

    // Update cache
    statusCache[deviceId] = currentStatus;
    localStorage.setItem("device-status-cache", JSON.stringify(statusCache));

    if (previousStatus && previousStatus !== currentStatus) {
      return { previousStatus, isStatusChange: true };
    }

    return { previousStatus, isStatusChange: false };
  } catch (error) {
    console.error("Error checking status change:", error);
    return { isStatusChange: false };
  }
}

// Notification creation
export function createNotification(
  id: string,
  title: string,
  message: string,
  rawDate: string,
  type: "warning" | "info" | "success",
  source: "tv" | "chromecast" | "channel" | "system",
  extras?: Partial<Notification>
): Notification {
  const statusChange = checkStatusChange(
    id,
    extras?.currentStatus || "offline"
  );
  const errorCategory = getErrorCategory(extras?.error, extras?.currentStatus);
  const suggestedSolutions = getSuggestedSolutions(
    extras?.error,
    source,
    errorCategory
  );

  return {
    id,
    title,
    message,
    rawDate,
    time: getRelativeTime(rawDate),
    date: formatDate(rawDate),
    type,
    source,
    errorCategory,
    previousStatus: statusChange.previousStatus as
      | "online"
      | "offline"
      | undefined,
    isStatusChange: statusChange.isStatusChange,
    suggestedSolutions,
    ...extras,
  };
}

// Storage management
export function cleanOldNotifications(
  notifications: Notification[]
): Notification[] {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const beforeCount = notifications.length;

  const cleaned = notifications.filter(
    (n) => new Date(n.rawDate).getTime() >= sevenDaysAgo
  );

  const removedCount = beforeCount - cleaned.length;
  if (removedCount > 0) {
    console.log(
      `Cleaned ${removedCount} old notifications (older than 7 days)`
    );
  }

  return cleaned;
}

export function saveNotificationsToStorage(
  notifications: Notification[]
): void {
  try {
    const cleaned = cleanOldNotifications(notifications);
    localStorage.setItem("notif-cache", JSON.stringify(cleaned));
    localStorage.setItem("notif-last-cleanup", Date.now().toString());
  } catch (error) {
    console.error("Failed to save notifications to storage:", error);
  }
}

export function getNotificationsFromStorage(): Notification[] {
  try {
    const cached = localStorage.getItem("notif-cache");
    const lastCleanup = localStorage.getItem("notif-last-cleanup");

    if (!cached) return [];

    const notifications = JSON.parse(cached) as Notification[];
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    // Auto cleanup every 24 hours
    if (!lastCleanup || now - parseInt(lastCleanup) > oneDayInMs) {
      const cleaned = cleanOldNotifications(notifications);
      saveNotificationsToStorage(cleaned);
      return cleaned;
    }

    return notifications;
  } catch (error) {
    console.error("Failed to get notifications from storage:", error);
    return [];
  }
}

// Main notification fetching
export async function fetchAllNotifications(): Promise<Notification[]> {
  const all: Notification[] = [];
  const errors: string[] = [];

  const fetchSources: FetchSource[] = [
    {
      name: "chromecast",
      url: "/api/chromecast",
      processor: (data: unknown[]) =>
        processChromecastNotifications(data as ChromecastDevice[], all),
    },
    {
      name: "tv",
      url: "/api/hospitality/tvs",
      processor: (data: unknown[]) =>
        processTVNotifications(data as TVDevice[], all),
    },
    {
      name: "channel",
      url: "/api/channels",
      processor: (data: unknown[]) =>
        processChannelNotifications(data as ChannelDevice[], all),
    },
  ];

  // Fetch from all sources with improved error handling
  await Promise.allSettled(
    fetchSources.map(async (source) => {
      try {
        const response = await fetch(source.url, { credentials: "include" });
        if (response.ok) {
          const json = await response.json();
          if (json.success && Array.isArray(json.data)) {
            source.processor(json.data);
          }
        } else {
          errors.push(`HTTP ${response.status} for ${source.name}`);
        }
      } catch (error) {
        errors.push(`Failed to fetch ${source.name}: ${error}`);
        console.error(`Error fetching ${source.name}:`, error);
      }
    })
  );

  // Merge with cached notifications and remove duplicates
  const oldNotifications = getNotificationsFromStorage();
  const validOldNotifications = cleanOldNotifications(oldNotifications);

  const newIds = new Set(all.map((n) => n.id));
  const uniqueOldNotifications = validOldNotifications.filter(
    (n) => !newIds.has(n.id)
  );

  all.push(...uniqueOldNotifications);

  // Sort by date (newest first) and save to storage
  const sortedAndCleaned = cleanOldNotifications(all).sort(
    (a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
  );

  saveNotificationsToStorage(sortedAndCleaned);

  if (errors.length > 0) {
    console.warn("Some fetch operations failed:", errors);
  }

  return sortedAndCleaned;
}

// Device-specific notification processors
function processChromecastNotifications(
  data: ChromecastDevice[],
  notifications: Notification[]
): void {
  data.forEach((device, index) => {
    const rawDate = device.lastSeen || new Date().toISOString();
    const deviceId = `chromecast-${
      device.idCast || device.deviceName || index
    }`;
    const currentStatus = device.isOnline ? "online" : "offline";

    // Handle offline devices
    if (!device.isOnline) {
      notifications.push(
        createNotification(
          deviceId,
          "Chromecast Device Offline",
          `${device.deviceName || "Unknown"} is offline`,
          rawDate,
          "warning",
          "chromecast",
          {
            deviceName: device.deviceName,
            ipAddr: device.ipAddr,
            currentStatus: "offline",
            error: device.error,
            responseTime: device.responseTime,
            signalLevel: device.signalLevel,
          }
        )
      );
    }

    // Handle recovery notifications
    const statusChange = checkStatusChange(deviceId, currentStatus);
    if (
      statusChange.isStatusChange &&
      statusChange.previousStatus === "offline" &&
      device.isOnline
    ) {
      notifications.push(
        createNotification(
          `${deviceId}-recovery`,
          "Chromecast Device Back Online",
          `${device.deviceName || "Unknown"} has recovered`,
          rawDate,
          "success",
          "chromecast",
          {
            deviceName: device.deviceName,
            ipAddr: device.ipAddr,
            currentStatus: "online",
            previousStatus: "offline",
            isStatusChange: true,
            responseTime: device.responseTime,
            signalLevel: device.signalLevel,
          }
        )
      );
    }
  });
}

function processTVNotifications(
  data: TVDevice[],
  notifications: Notification[]
): void {
  data.forEach((device, index) => {
    const rawDate = device.lastChecked || new Date().toISOString();
    const deviceId = `tv-${device.id || index}`;
    const currentStatus = device.status === "online" ? "online" : "offline";

    // Handle offline TVs
    if (device.status === "offline") {
      notifications.push(
        createNotification(
          deviceId,
          "TV Device Offline",
          `Room ${device.roomNo || "Unknown"} TV is offline`,
          rawDate,
          "warning",
          "tv",
          {
            roomNo: device.roomNo,
            deviceName: `Room ${device.roomNo}`,
            ipAddr: device.ipAddress,
            currentStatus: "offline",
            error: device.error,
            responseTime: device.responseTime,
            signalLevel: device.signalLevel,
          }
        )
      );
    }

    // Handle TV recovery notifications
    const statusChange = checkStatusChange(deviceId, currentStatus);
    if (
      statusChange.isStatusChange &&
      statusChange.previousStatus === "offline" &&
      device.status === "online"
    ) {
      notifications.push(
        createNotification(
          `${deviceId}-recovery`,
          "TV Device Back Online",
          `Room ${device.roomNo || "Unknown"} TV has recovered`,
          rawDate,
          "success",
          "tv",
          {
            roomNo: device.roomNo,
            deviceName: `Room ${device.roomNo}`,
            ipAddr: device.ipAddress,
            currentStatus: "online",
            previousStatus: "offline",
            isStatusChange: true,
            responseTime: device.responseTime,
            signalLevel: device.signalLevel,
          }
        )
      );
    }
  });
}

function processChannelNotifications(
  data: ChannelDevice[],
  notifications: Notification[]
): void {
  data.forEach((channel, index) => {
    const rawDate = channel.lastChecked || new Date().toISOString();
    const deviceId = `channel-${channel.id || index}`;
    const currentStatus = channel.status === "online" ? "online" : "offline";

    // Handle offline channels
    if (channel.status === "offline") {
      notifications.push(
        createNotification(
          deviceId,
          "Channel Offline",
          `${channel.channelName || "Unknown"} is offline`,
          rawDate,
          "warning",
          "channel",
          {
            deviceName: channel.channelName,
            ipAddr: channel.ipMulticast,
            currentStatus: "offline",
            error: channel.error,
            responseTime: channel.responseTime,
            signalLevel: channel.signalLevel,
          }
        )
      );
    }

    // Handle channel recovery notifications
    const statusChange = checkStatusChange(deviceId, currentStatus);
    if (
      statusChange.isStatusChange &&
      statusChange.previousStatus === "offline" &&
      channel.status === "online"
    ) {
      notifications.push(
        createNotification(
          `${deviceId}-recovery`,
          "Channel Back Online",
          `${channel.channelName || "Unknown"} has recovered`,
          rawDate,
          "success",
          "channel",
          {
            deviceName: channel.channelName,
            ipAddr: channel.ipMulticast,
            currentStatus: "online",
            previousStatus: "offline",
            isStatusChange: true,
            responseTime: channel.responseTime,
            signalLevel: channel.signalLevel,
          }
        )
      );
    }
  });
}
