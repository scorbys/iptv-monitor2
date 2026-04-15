"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  FunnelIcon,
  FolderIcon
} from "@heroicons/react/24/outline";
import {
  Notification,
  fetchAllNotifications,
  cleanOldNotifications,
} from "../../app/notifications/notifUtils";
import { calculateMetricScore } from "@/utils/metricCalculator";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QoSRow {
  category: string;
  issueLabel: string;
  device: string;
  count: number;
  avgPacketLoss: number;
  labelPacketLoss: string;
  avgJitter: number;
  labelJitter: string;
  avgLatency: number;
  labelLatency: string;
  avgErrorRate: number;
  labelErrorRate: string;
  avgRecoveryTime: number;
  labelRecoveryTime: string;
  avgSignalLevel: number;
  avgResponseTime: number;
  avgBandwidth: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const FAQ_DATA = [
  { category: "Kategori-1", device: "Chromecast", issue: "No Device Found Chromecast", keywords: ["no device found", "chromecast", "not found", "device offline"] },
  { category: "Kategori-2", device: "IPTV", issue: "Weak Or No Signal", keywords: ["weak", "signal", "no signal", "iptv", "tv offline"] },
  { category: "Kategori-3", device: "IPTV", issue: "Unplug LAN TV", keywords: ["unplug", "lan", "cable", "connection", "lan in", "lan out"] },
  { category: "Kategori-4", device: "Chromecast", issue: "Chromecast Setup iOS", keywords: ["setup", "ios", "iphone", "google home", "local network"] },
  { category: "Kategori-5", device: "Channel", issue: "Error Playing", keywords: ["error playing", "playing", "stream", "video"] },
  { category: "Kategori-6", device: "Channel", issue: "Error_Player_Error_Err", keywords: ["player error", "player_error", "hbrowser", "widget"] },
  { category: "Kategori-7", device: "Channel", issue: "Connection_Failure", keywords: ["connection failure", "connection_failure", "ip conflict", "network"] },
  { category: "Kategori-8", device: "Chromecast", issue: "Reset Configuration", keywords: ["reset", "configuration", "restart", "power"] },
  { category: "Kategori-9", device: "IPTV", issue: "No Device Logged", keywords: ["no device logged", "logged", "login", "authentication"] },
  { category: "Kategori-10", device: "Chromecast", issue: "Chromecast Black Screen", keywords: ["black screen", "screen", "adaptor", "power"] },
  { category: "Kategori-11", device: "Channel", issue: "Channel Not Found", keywords: ["channel not found", "not found", "channel", "missing"] },
  { category: "Kategori-12", device: "Chromecast", issue: "Network Connection Failed", keywords: ["network connection", "connection failed", "wifi", "router", "network"] },
  { category: "Kategori-13", device: "IPTV", issue: "System Initialization Error", keywords: ["initialization", "system error", "firmware", "boot"] },
  { category: "Kategori-14", device: "Chromecast", issue: "No Device Found: Logined", keywords: ["logined", "logged in", "authentication", "no device found", "registered"] },
];

const SOURCE_TO_DEVICE: Record<string, string> = {
  chromecast: "chromecast",
  tv: "iptv",
  channel: "channel",
  system: "system",
};

const SCORE_TO_LABEL: Record<number, string> = {
  4: "Good",
  3: "Fair",
  2: "Poor",
  1: "Very Poor",
};

const LABEL_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Good: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Fair: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  Poor: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  "Very Poor": { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  "N/A": { bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-300" },
};

const DEVICE_COLORS: Record<string, string> = {
  Chromecast: "bg-blue-100 text-blue-700",
  IPTV: "bg-purple-100 text-purple-700",
  Channel: "bg-teal-100 text-teal-700",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreToLabel(score: number): string {
  return SCORE_TO_LABEL[score] ?? "N/A";
}

function avgScoreToLabel(scores: number[]): string {
  if (scores.length === 0) return "N/A";
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const rounded = Math.round(avg);
  return SCORE_TO_LABEL[Math.max(1, Math.min(4, rounded))] ?? "N/A";
}

function safe(val: number | undefined | null, fallback = 0): number {
  return (val != null && isFinite(val)) ? val : fallback;
}

function getCategoryNumber(category: string): number {
  const match = category.match(/Kategori-(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function getFAQCategory(notification: Notification, cache: Map<string, string | null>): string | null {
  const key = `${notification.source}|${(notification.title || "").slice(0, 40)}|${(notification.message || "").slice(0, 40)}|${notification.error || ""}|${notification.errorCategory || ""}`;
  if (cache.has(key)) return cache.get(key)!;

  const text = [
    notification.title, notification.message,
    notification.error, notification.deviceName, notification.errorCategory,
  ].join(" ").toLowerCase()
    .replace(/katagori-/gi, "kategori-");

  const expectedDevice = SOURCE_TO_DEVICE[notification.source] || null;

  const scored = FAQ_DATA.map((faq) => {
    let score = 0;
    const faqDevice = faq.device.toLowerCase();
    if (!expectedDevice || faqDevice === expectedDevice) score += 10; else score -= 5;
    const hits = faq.keywords.filter((kw) => text.includes(kw)).length;
    score += hits * 5;
    if (hits > 0) score += 3;
    return { category: faq.category, score };
  });

  const best = scored.filter((s) => s.score > 5).sort((a, b) => b.score - a.score)[0];
  const result = best?.category ?? null;
  cache.set(key, result);
  return result;
}

function extractMetrics(n: Notification) {
  const m = (n as any).metrics || {};
  const lm = (n as any).labeledMetrics || {};
  const ns = (n as any).networkStats || {};

  const isOffline =
    n.currentStatus === "offline" ||
    n.reportStatus === "pending" ||
    n.reportStatus === "investigating";

  const packetLoss = safe(m.packetLoss);
  const jitter = safe(m.jitter);
  const latency = safe(m.latency);
  const errorRate = safe(m.error);
  const recoveryTime = safe(m.recoveryTime);
  const bandwidth = safe(ns.bandwidth);
  const signalLevel = safe(n.signalLevel);
  const responseTime = safe(n.responseTime);

  const plScore = isOffline ? 1 : (lm.packetLossLabel?.label ?? calculateMetricScore(packetLoss, "packetLoss"));
  const jiScore = isOffline ? 1 : (lm.jitterLabel?.label ?? calculateMetricScore(jitter, "jitter"));
  const laScore = isOffline ? 1 : (lm.latencyLabel?.label ?? calculateMetricScore(latency, "latency"));
  const erScore = isOffline ? 1 : (lm.errorLabel?.label ?? calculateMetricScore(errorRate, "error"));
  const rtScore = isOffline ? 1 : (lm.recoveryTimeLabel?.label ?? calculateMetricScore(recoveryTime, "recoveryTime"));

  return {
    packetLoss, jitter, latency, errorRate, recoveryTime,
    bandwidth, signalLevel, responseTime,
    plScore, jiScore, laScore, erScore, rtScore
  };
}

// ─── QoS Aggregator ───────────────────────────────────────────────────────────

function buildQoSRows(notifications: Notification[], cache: Map<string, string | null>): QoSRow[] {
  const buckets: Record<string, {
    faq: typeof FAQ_DATA[0];
    count: number;
    pl: number[]; ji: number[]; la: number[]; er: number[]; rt: number[];
    plS: number[]; jiS: number[]; laS: number[]; erS: number[]; rtS: number[];
    sig: number[]; resp: number[]; bw: number[];
  }> = {};

  // initialise all 14 categories so they always appear
  FAQ_DATA.forEach((faq) => {
    buckets[faq.category] = {
      faq, count: 0,
      pl: [], ji: [], la: [], er: [], rt: [],
      plS: [], jiS: [], laS: [], erS: [], rtS: [],
      sig: [], resp: [], bw: [],
    };
  });

  notifications.forEach((n) => {
    const cat = getFAQCategory(n, cache);
    if (!cat || !buckets[cat]) return;

    const b = buckets[cat];
    b.count++;

    const mx = extractMetrics(n);
    b.pl.push(mx.packetLoss); b.plS.push(mx.plScore);
    b.ji.push(mx.jitter); b.jiS.push(mx.jiScore);
    b.la.push(mx.latency); b.laS.push(mx.laScore);
    b.er.push(mx.errorRate); b.erS.push(mx.erScore);
    b.rt.push(mx.recoveryTime); b.rtS.push(mx.rtScore);
    if (mx.signalLevel > 0) b.sig.push(mx.signalLevel);
    if (mx.responseTime > 0) b.resp.push(mx.responseTime);
    if (mx.bandwidth > 0) b.bw.push(mx.bandwidth);
  });

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return FAQ_DATA.map(({ category }) => {
    const b = buckets[category];
    return {
      category,
      issueLabel: b.faq.issue,
      device: b.faq.device,
      count: b.count,
      avgPacketLoss: avg(b.pl),
      labelPacketLoss: avgScoreToLabel(b.plS),
      avgJitter: avg(b.ji),
      labelJitter: avgScoreToLabel(b.jiS),
      avgLatency: avg(b.la),
      labelLatency: avgScoreToLabel(b.laS),
      avgErrorRate: avg(b.er),
      labelErrorRate: avgScoreToLabel(b.erS),
      avgRecoveryTime: avg(b.rt),
      labelRecoveryTime: avgScoreToLabel(b.rtS),
      avgSignalLevel: avg(b.sig),
      avgResponseTime: avg(b.resp),
      avgBandwidth: avg(b.bw),
    };
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LabelBadge({ label }: { label: string }) {
  const c = LABEL_COLORS[label] ?? LABEL_COLORS["N/A"];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {label}
    </span>
  );
}

function MetricCell({ value, unit, label }: { value: number; unit: string; label: string }) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="text-sm font-semibold text-gray-900 tabular-nums">
        {value > 0 ? value.toFixed(2) : "—"} <span className="text-xs font-normal text-gray-400">{unit}</span>
      </span>
      <LabelBadge label={label} />
    </div>
  );
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl p-4 border ${color}`}>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QosPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dbTotalCount, setDbTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [cacheHydrated, setCacheHydrated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState<"all" | "Chromecast" | "IPTV" | "Channel">("all");
  const [labelFilter, setLabelFilter] = useState<"all" | "Good" | "Fair" | "Poor" | "Very Poor">("all");
  const [sortKey, setSortKey] = useState<keyof QoSRow>("category");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const categoryCache = useRef<Map<string, string | null>>(new Map());

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const fresh = await fetchAllNotifications();
      setNotifications(cleanOldNotifications(fresh));

      try {
        const token = localStorage.getItem("authToken") || localStorage.getItem("token");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch("/api/notifications/stats", {
          headers: new Headers(headers),
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          const count = data.data?.totalNotifications ?? data.data?.total;
          if (typeof count === "number") {
            setDbTotalCount(count);
          }
        }
      } catch (error) {
        console.warn("Failed to fetch notifications count:", error);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCacheHydrated(true);
    }
  }, []);

  useEffect(() => {
    // Try cache first
    try {
      const cached = localStorage.getItem("notif-cache");
      if (cached) {
        const parsed: Notification[] = JSON.parse(cached);
        setNotifications(cleanOldNotifications(parsed));
        setCacheHydrated(true);
      }
    } catch { /* ignore */ }
    load();
  }, [load]);

  // ── QoS rows ──────────────────────────────────────────────────────────────

  const rows = useMemo(
    () => buildQoSRows(notifications, categoryCache.current),
    [notifications]
  );

  // ── Filtered + sorted ─────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let out = rows;
    if (deviceFilter !== "all") out = out.filter((r) => r.device === deviceFilter);
    if (labelFilter !== "all") {
      out = out.filter((r) =>
        r.labelPacketLoss === labelFilter ||
        r.labelJitter === labelFilter ||
        r.labelLatency === labelFilter ||
        r.labelErrorRate === labelFilter ||
        r.labelRecoveryTime === labelFilter
      );
    }
    return [...out].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (sortKey === "category") {
        const aNum = getCategoryNumber(av as string);
        const bNum = getCategoryNumber(bv as string);
        return sortDir === "asc" ? aNum - bNum : bNum - aNum;
      }
      if (typeof av === "number" && typeof bv === "number")
        return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [rows, deviceFilter, labelFilter, sortKey, sortDir]);

  // ── Summary stats ─────────────────────────────────────────────────────────

  const summary = useMemo(() => {
    const active = rows.filter((r) => r.count > 0);
    const totalIssues = active.reduce((s, r) => s + r.count, 0);
    const avgPL = active.length
      ? active.reduce((s, r) => s + r.avgPacketLoss, 0) / active.length : 0;
    const avgLat = active.length
      ? active.reduce((s, r) => s + r.avgLatency, 0) / active.length : 0;
    const worstCat = [...active].sort((a, b) => b.count - a.count)[0];
    return { totalIssues, avgPL, avgLat, worstCat };
  }, [rows]);

  // ── Sort toggle ───────────────────────────────────────────────────────────

  const toggleSort = (key: keyof QoSRow) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ k }: { k: keyof QoSRow }) =>
    sortKey === k ? (
      <span className="ml-1 text-blue-500">{sortDir === "asc" ? "↑" : "↓"}</span>
    ) : (
      <span className="ml-1 text-gray-300">↕</span>
    );

  // ── Export CSV ────────────────────────────────────────────────────────────

  const exportCSV = useCallback(async () => {
    if (exportLoading) return;
    setExportLoading(true);
    try {
      // Refresh data before export
      const fresh = await fetchAllNotifications();
      const cleaned = cleanOldNotifications(fresh);
      setNotifications(cleaned);
      const exportRows = buildQoSRows(cleaned, categoryCache.current);

      const headers = [
        "Issue Categories",
        "Issue Label",
        "Device Type",
        "Count Report",
        "Avg Packet Loss (%)",
        "Label Avg Packet Loss",
        "Avg Jitter (ms)",
        "Label Avg Jitter",
        "Avg Latency (ms)",
        "Label Avg Latency",
        "Avg Error Rate (%)",
        "Label Avg Error Rate",
        "Avg Recovery Time (s)",
        "Label Avg Recovery Time",
      ];

      const csvRows = exportRows.map((r) => [
        r.category,
        r.issueLabel,
        r.device,
        r.count,
        r.avgPacketLoss.toFixed(2),
        r.labelPacketLoss,
        r.avgJitter.toFixed(2),
        r.labelJitter,
        r.avgLatency.toFixed(2),
        r.labelLatency,
        r.avgErrorRate.toFixed(2),
        r.labelErrorRate,
        r.avgRecoveryTime.toFixed(2),
        r.labelRecoveryTime,
      ]);

      const escape = (v: string | number) => {
        const s = String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"` : s;
      };

      const content = [headers, ...csvRows]
        .map((row) => row.map(escape).join(","))
        .join("\n");

      const bom = "\uFEFF";
      const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const ts = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
      link.href = url;
      link.download = `qos_report_${ts}.csv`;
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (link.parentNode === document.body) document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch {
      alert("Failed to export. Please try again.");
    } finally {
      setExportLoading(false);
    }
  }, [exportLoading]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading && !cacheHydrated) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="text-sm text-gray-500">Loading QoS data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4 sm:p-6">
      <div className="max-w-screen-2xl mx-auto space-y-6">

        {/* ── Enhanced Header with Gradient ── */}
        <div className="mb-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='7' r='1'/%3E%3Ccircle cx='47' cy='7' r='1'/%3E%3Ccircle cx='7' cy='27' r='1'/%3E%3Ccircle cx='27' cy='27' r='1'/%3E%3Ccircle cx='47' cy='27' r='1'/%3E%3Ccircle cx='7' cy='47' r='1'/%3E%3Ccircle cx='27' cy='47' r='1'/%3E%3Ccircle cx='47' cy='47' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <SignalIcon className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">
                      Quality of Service Dashboard
                    </h1>
                  </div>
                  <p className="text-blue-100 text-lg mb-4">
                    Network metrics and performance analysis across all issue categories
                  </p>

                  {/* Stats Pills */}
                  <div className="flex flex-wrap gap-3">
                    {/* <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <ChartBarIcon className="w-4 h-4 text-white" />
                      <span className="text-white font-semibold">{notifications.length}</span>
                      <span className="text-blue-100 text-sm">Notifications</span>
                    </div> */ }
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <ExclamationTriangleIcon className="w-4 h-4 text-white" />
                      <span className="text-white font-semibold">{dbTotalCount ?? summary.totalIssues}</span>
                      <span className="text-blue-100 text-sm">Total Issues</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <FunnelIcon className="w-4 h-4 text-white" />
                      <span className="text-white font-semibold">
                        {rows.filter((r) => r.count > 0).length}/{`${FAQ_DATA.length}`}
                      </span>
                      <span className="text-blue-100 text-sm">Active Cat</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <FolderIcon className="w-4 h-4 text-white" />
                      <span className="text-white font-semibold">{summary.worstCat?.category ?? "—"}</span>
                      <span className="text-blue-100 text-sm">Most</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => load(true)}
                    disabled={refreshing}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-white/20 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-white/30 disabled:opacity-50 transition-all border border-white/30 shadow-lg hover:shadow-xl"
                  >
                    <ArrowPathIcon className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
                    {refreshing ? "Refreshing…" : "Refresh Data"}
                  </button>
                  <button
                    onClick={exportCSV}
                    disabled={exportLoading}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    {exportLoading ? "Exporting…" : "Export CSV"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard
            label="Total Issues"
            value={summary.totalIssues}
            sub="across all categories"
            color="border-blue-200 bg-blue-50"
          />
          <SummaryCard
            label="Active Categories"
            value={rows.filter((r) => r.count > 0).length}
            sub={`of ${FAQ_DATA.length} total`}
            color="border-purple-200 bg-purple-50"
          />
          <SummaryCard
            label="Avg Packet Loss"
            value={`${summary.avgPL.toFixed(2)}%`}
            sub="across active categories"
            color="border-orange-200 bg-orange-50"
          />
          <SummaryCard
            label="Most Issues"
            value={summary.worstCat?.category ?? "—"}
            sub={summary.worstCat ? `${summary.worstCat.count} reports` : "no data"}
            color="border-red-200 bg-red-50"
          />
        </div> */}

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-xl p-4">
          <FunnelIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-600">Filter:</span>

          {/* Device filter */}
          <div className="flex items-center gap-1">
            {(["all", "Chromecast", "IPTV", "Channel"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDeviceFilter(d)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${deviceFilter === d
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {d === "all" ? "All Devices" : d}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-gray-200" />

          {/* Label filter */}
          <div className="flex items-center gap-1">
            {(["all", "Good", "Fair", "Poor", "Very Poor"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLabelFilter(l)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${labelFilter === l
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {l === "all" ? "All Labels" : l}
              </button>
            ))}
          </div>

          <div className="ml-auto text-xs text-gray-400">
            {filtered.length} categor{filtered.length === 1 ? "y" : "ies"}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {/* Category */}
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                    onClick={() => toggleSort("category")}
                  >
                    Category <SortIcon k="category" />
                  </th>
                  {/* Issue */}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                    Issue
                  </th>
                  {/* Device */}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                    Device
                  </th>
                  {/* Count */}
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                    onClick={() => toggleSort("count")}
                  >
                    Count <SortIcon k="count" />
                  </th>
                  {/* Packet Loss */}
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                    onClick={() => toggleSort("avgPacketLoss")}
                  >
                    Avg Packet Loss <SortIcon k="avgPacketLoss" />
                  </th>
                  {/* Jitter */}
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                    onClick={() => toggleSort("avgJitter")}
                  >
                    Avg Jitter <SortIcon k="avgJitter" />
                  </th>
                  {/* Latency */}
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                    onClick={() => toggleSort("avgLatency")}
                  >
                    Avg Latency <SortIcon k="avgLatency" />
                  </th>
                  {/* Error Rate */}
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                    onClick={() => toggleSort("avgErrorRate")}
                  >
                    Avg Error Rate <SortIcon k="avgErrorRate" />
                  </th>
                  {/* Recovery Time */}
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                    onClick={() => toggleSort("avgRecoveryTime")}
                  >
                    Avg Recovery <SortIcon k="avgRecoveryTime" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center text-gray-400">
                      <ExclamationTriangleIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      No categories match the current filters
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr
                      key={row.category}
                      className={`hover:bg-gray-50 transition-colors ${row.count === 0 ? "opacity-50" : ""}`}
                    >
                      {/* Category */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-gray-900">{row.category}</span>
                      </td>
                      {/* Issue */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <span className="text-gray-700 text-xs leading-tight line-clamp-2">{row.issueLabel}</span>
                      </td>
                      {/* Device */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DEVICE_COLORS[row.device] ?? "bg-gray-100 text-gray-600"}`}>
                          {row.device}
                        </span>
                      </td>
                      {/* Count */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.count > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-[60px] bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full"
                                style={{
                                  width: `${Math.min(100, (row.count / (Math.max(...filtered.map((r) => r.count)) || 1)) * 100)}%`,
                                }}
                              />
                            </div>
                            <span className="font-bold text-gray-900 tabular-nums">{row.count}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">No data</span>
                        )}
                      </td>
                      {/* Packet Loss */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <MetricCell value={row.avgPacketLoss} unit="%" label={row.labelPacketLoss} />
                      </td>
                      {/* Jitter */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <MetricCell value={row.avgJitter} unit="ms" label={row.labelJitter} />
                      </td>
                      {/* Latency */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <MetricCell value={row.avgLatency} unit="ms" label={row.labelLatency} />
                      </td>
                      {/* Error Rate */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <MetricCell value={row.avgErrorRate} unit="%" label={row.labelErrorRate} />
                      </td>
                      {/* Recovery Time */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <MetricCell value={row.avgRecoveryTime} unit="s" label={row.labelRecoveryTime} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 bg-white border border-gray-200 rounded-xl px-4 py-3">
          <ChartBarIcon className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-600">Label Legend:</span>
          {Object.entries(LABEL_COLORS)
            .filter(([k]) => k !== "N/A")
            .map(([label, c]) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                <span>{label}</span>
              </span>
            ))}
          <span className="ml-auto">
            Labels derived from metric scores: 4 = Good · 3 = Fair · 2 = Poor · 1 = Very Poor
          </span>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Data sourced from notification metrics · auto-refreshes every 30 min</span>
          <span>
            Export includes all {FAQ_DATA.length} categories regardless of active filters
          </span>
        </div>
      </div>
    </div>
  );
}