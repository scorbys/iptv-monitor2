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
  idCast: string | number;
  deviceName?: string;
  ipAddr?: string;
  isOnline?: boolean;
  isPingable?: boolean;
  lastSeen?: string;
  error?: string;
  responseTime?: number;
  signalLevel?: number;
  speed?: number;
  type?: string;
  model?: string;
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
  channelNumber?: number;
  ipMulticast?: string;
  status?: string;
  lastChecked?: string;
  error?: string;
  responseTime?: number;
  signalLevel?: number;
  bitrate?: number;
  networkStats?: {
    sent?: string;
    received?: string;
    latency?: number;
    jitter?: number;
    ttl?: number;
    packetLoss?: number;
    bandwidth?: number;
    hops?: number;
    signalStrength?: number;
    bitrate?: number;
  };
}

interface FetchSource {
  name: string;
  url: string;
  processor: (data: unknown[]) => void;
}

export function getErrorCategory(
  error?: string,
  status?: string,
  source?: string
): string {
  if (status === "offline" && !error) {
    return "Connection";
  }

  if (!error) return "System";
  const errorLower = error.toLowerCase();

  if (source === "chromecast") {
    if (
      errorLower.includes("no device found") ||
      errorLower.includes("not found") ||
      errorLower.includes("offline")
    ) {
      return "Device";
    }
    if (
      errorLower.includes("black screen") ||
      errorLower.includes("adaptor") ||
      errorLower.includes("power")
    ) {
      return "Power";
    }
    if (
      errorLower.includes("setup") ||
      errorLower.includes("local network") ||
      errorLower.includes("authentication")
    ) {
      return "Auth";
    }
  }

  if (source === "tv") {
    if (
      errorLower.includes("weak signal") ||
      errorLower.includes("no signal") ||
      errorLower.includes("offline")
    ) {
      return "Signal";
    }
    if (
      errorLower.includes("lan") ||
      errorLower.includes("cable") ||
      errorLower.includes("unplug")
    ) {
      return "Cable";
    }
  }

  if (source === "channel") {
    if (
      errorLower.includes("playing") ||
      errorLower.includes("player") ||
      errorLower.includes("stream")
    ) {
      return "Stream";
    }
    if (errorLower.includes("not found") || errorLower.includes("missing")) {
      return "Missing";
    }
  }

  if (
    errorLower.includes("network") ||
    errorLower.includes("connection") ||
    errorLower.includes("timeout") ||
    errorLower.includes("offline")
  ) {
    return "Network";
  }

  if (
    errorLower.includes("power") ||
    errorLower.includes("boot") ||
    errorLower.includes("hardware")
  ) {
    return "Power";
  }

  if (
    errorLower.includes("authentication") ||
    errorLower.includes("login") ||
    errorLower.includes("credential")
  ) {
    return "Auth";
  }

  if (
    errorLower.includes("configuration") ||
    errorLower.includes("setting") ||
    errorLower.includes("setup")
  ) {
    return "Config";
  }

  return "System";
}

export function getSuggestedSolutions(
  error?: string,
  deviceSource?: string,
  errorCategory?: string
): string[] {
  if (!error && !errorCategory) return [];

  const errorLower = error?.toLowerCase() || "";
  const solutions: string[] = [];

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

  if (solutions.length === 0) {
    solutions.push(...getGenericSolutions(errorCategory));
  }

  return solutions;
}

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

function checkStatusChange(
  deviceId: string,
  currentStatus: string
): { previousStatus?: string; isStatusChange: boolean } {
  try {
    const cached = localStorage.getItem("device-status-cache");
    const statusCache = cached ? JSON.parse(cached) : {};
    const previousStatus = statusCache[deviceId];

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

export function createNotification(
  id: string,
  title: string,
  message: string,
  rawDate: string,
  type: "warning" | "info" | "success",
  source: "tv" | "chromecast" | "channel" | "system",
  extras?: Partial<Notification>
): Notification {
  const currentStatus = extras?.currentStatus || "offline";
  const statusChange = checkStatusChange(id, currentStatus);

  const errorCategory =
    extras?.errorCategory || getErrorCategory(extras?.error, currentStatus);
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
    currentStatus,
    previousStatus:
      extras?.previousStatus ||
      (statusChange.previousStatus as "online" | "offline" | undefined),
    isStatusChange:
      extras?.isStatusChange !== undefined
        ? extras.isStatusChange
        : statusChange.isStatusChange,
    suggestedSolutions,
    ...extras,
  };
}

// Debug logging utility - only logs in development mode
const debugLog = (message: string, ...args: unknown[]): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[NOTIF_DEBUG] ${message}`, ...args);
  }
};

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
    debugLog(`Cleaned ${removedCount} old notifications (older than 7 days)`);
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

  await Promise.allSettled(
    fetchSources.map(async (source) => {
      try {
        const response = await fetch(source.url, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const json = await response.json();
          let dataArray: unknown[] = [];

          if (json.success && Array.isArray(json.data)) {
            dataArray = json.data;
          } else if (Array.isArray(json)) {
            dataArray = json;
          } else if (json.data && Array.isArray(json.data)) {
            dataArray = json.data;
          } else {
            console.warn(
              `Unexpected response format for ${source.name}:`,
              json
            );
            errors.push(`Invalid response format for ${source.name}`);
            return;
          }

          if (dataArray.length >= 0) {
            source.processor(dataArray);
            debugLog(`Processed ${dataArray.length} items from ${source.name}`);
          }
        } else {
          const errorText = await response.text();
          console.error(
            `HTTP ${response.status} for ${source.name}:`,
            errorText
          );
          errors.push(`HTTP ${response.status} for ${source.name}`);
        }
      } catch (error) {
        errors.push(`Failed to fetch ${source.name}: ${error}`);
        console.error(`Error fetching ${source.name}:`, error);
      }
    })
  );

  const oldNotifications = getNotificationsFromStorage();
  const validOldNotifications = cleanOldNotifications(oldNotifications);
  const newIds = new Set(all.map((n) => n.id));
  const uniqueOldNotifications = validOldNotifications.filter(
    (n) => !newIds.has(n.id)
  );

  all.push(...uniqueOldNotifications);

  const sortedAndCleaned = cleanOldNotifications(all).sort(
    (a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
  );

  saveNotificationsToStorage(sortedAndCleaned);

  if (errors.length > 0) {
    console.warn("Some fetch operations failed:", errors);
  }

  debugLog(`Fetched ${all.length} total notifications (${errors.length} errors)`);
  return sortedAndCleaned;
}

function processChromecastNotifications(
  data: ChromecastDevice[],
  notifications: Notification[]
): void {
  data.forEach((device, index) => {
    const rawDate = device.lastSeen || new Date().toISOString();
    const deviceId = `chromecast-${
      device.idCast || device.deviceName || index
    }`;

    const isOnline = device.isOnline === true;
    const currentStatus = isOnline ? "online" : "offline";

    if (!isOnline) {
      const error = device.error || "Device not responding";
      const errorCategory = getErrorCategory(error, "offline", "chromecast");

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
            error: error,
            errorCategory: errorCategory,
            responseTime: device.responseTime || undefined,
            signalLevel: device.signalLevel || undefined,
          }
        )
      );
    }

    const statusChange = checkStatusChange(deviceId, currentStatus);
    if (
      statusChange.isStatusChange &&
      statusChange.previousStatus === "offline" &&
      isOnline
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
            responseTime: device.responseTime || undefined,
            signalLevel: device.signalLevel || undefined,
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
    const deviceId = `tv-${device.id || device.roomNo || index}`;
    const isOnline = device.status === "online";
    const currentStatus = isOnline ? "online" : "offline";

    if (!isOnline) {
      const error = device.error || "TV not responding";
      const errorCategory = getErrorCategory(error, "offline", "tv");

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
            error: error,
            errorCategory: errorCategory,
            responseTime: device.responseTime || undefined,
            signalLevel: device.signalLevel || undefined,
          }
        )
      );
    }

    const statusChange = checkStatusChange(deviceId, currentStatus);
    if (
      statusChange.isStatusChange &&
      statusChange.previousStatus === "offline" &&
      isOnline
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
            responseTime: device.responseTime || undefined,
            signalLevel: device.signalLevel || undefined,
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
    const isOnline = channel.status === "online";
    const currentStatus = isOnline ? "online" : "offline";

    if (!isOnline) {
      const error = channel.error || "Channel not available";
      const errorCategory = getErrorCategory(error, "offline", "channel");

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
            error: error,
            errorCategory: errorCategory,
            responseTime: channel.responseTime || undefined,
            signalLevel: channel.signalLevel || undefined,
          }
        )
      );
    }

    const statusChange = checkStatusChange(deviceId, currentStatus);
    if (
      statusChange.isStatusChange &&
      statusChange.previousStatus === "offline" &&
      isOnline
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
            responseTime: channel.responseTime || undefined,
            signalLevel: channel.signalLevel || undefined,
          }
        )
      );
    }
  });
}
