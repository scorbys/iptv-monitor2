"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ChevronDown,
  Monitor,
  Tv,
  Radio,
  HelpCircle,
  Filter,
  LucideIcon,
} from "lucide-react";

// Types
interface FAQ {
  id: number;
  category: string;
  device: string;
  issue: string;
  solutions: string[];
  hasImage: boolean;
  actionType: string;
  priority: string;
  slug: string;
}

interface DeviceConfig {
  icon: LucideIcon;
  color: string;
  bgLight: string;
  textColor: string;
}

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

interface FilterSectionProps {
  selectedDevice: string;
  setSelectedDevice: (device: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedIssue: string;
  setSelectedIssue: (issue: string) => void;
}

interface ArticleCardProps {
  article: FAQ;
}

const faqData: FAQ[] = [
  {
    id: 1,
    category: "Kategori-1",
    device: "Chromecast",
    issue: "No Device Found Chromecast",
    solutions: [
      "Deactive White list profile",
      "Restart Chromecast & WIFI",
      "Radisson Guest Must Be Login",
      "Forget WIFI Radisson Guest",
      "Logout WIFI (log-out.me)",
    ],
    hasImage: true,
    actionType: "System",
    priority: "High",
    slug: "no-device-found-chromecast"
  },
  {
    id: 2,
    category: "Kategori-2",
    device: "IPTV",
    issue: "Weak Or No Signal",
    solutions: [
      "Periksa koneksi LAN pada TV",
      "Pastikan sumber HDMI diatur ke HDMI-1",
      "Restart perangkat IPTV",
      "Periksa indikator LED pada box IPTV",
    ],
    hasImage: true,
    actionType: "On Site",
    priority: "Medium",
    slug: "weak-or-no-signal"
  },
  {
    id: 3,
    category: "Kategori-3",
    device: "IPTV",
    issue: "Unplug LAN TV",
    solutions: [
      "Periksa koneksi LAN (pastikan terpasang di LAN IN)",
      "Posisikan kabel LAN dengan benar",
      "Pastikan tidak terpasang di LAN OUT",
      "Test koneksi dengan kabel LAN lain",
    ],
    hasImage: true,
    actionType: "On Site",
    priority: "High",
    slug: "unplug-lan-tv"
  },
  {
    id: 4,
    category: "Kategori-4",
    device: "Chromecast",
    issue: "Chromecast Setup iOS",
    solutions: [
      "Install Google Home app",
      "Pastikan perangkat dalam satu jaringan WiFi",
      "Allow local network access pada iPhone",
      "Follow setup wizard di aplikasi",
    ],
    hasImage: true,
    actionType: "System",
    priority: "Medium",
    slug: "chromecast-setup-ios"
  },
  {
    id: 5,
    category: "Kategori-5",
    device: "Channel",
    issue: "Error Playing",
    solutions: ["Channel issue dari Biznet (Testing VIA VLC)"],
    hasImage: false,
    actionType: "System",
    priority: "Medium",
    slug: "error-playing"
  },
  {
    id: 6,
    category: "Kategori-6",
    device: "Channel",
    issue: "Error_Player_Error_Err",
    solutions: [
      "Hbrowser & Widget Solution incorrect",
      "Channel issue Biznet (Testing VLC)",
    ],
    hasImage: false,
    actionType: "System",
    priority: "High",
    slug: "error-player-error"
  },
  {
    id: 7,
    category: "Kategori-7",
    device: "Channel",
    issue: "Connection_Failure",
    solutions: [
      "Reinstall Widget Solution",
      "Reload IGCMP",
      "Confirmed IP conflict, changed IP, issue resolved",
    ],
    hasImage: false,
    actionType: "System",
    priority: "Medium",
    slug: "connection-failure"
  },
  {
    id: 8,
    category: "Kategori-8",
    device: "Chromecast",
    issue: "Reset Configuration",
    solutions: [
      "Restart Chromecast",
      "Reset Chromecast dibawa ke ruang server pencet tombol poer 10 Detik",
    ],
    hasImage: false,
    actionType: "On Site",
    priority: "Low",
    slug: "reset-configuration"
  },
  {
    id: 9,
    category: "Kategori-9",
    device: "IPTV",
    issue: "No Device Logged",
    solutions: [
      "Pastikan Allow local Network pada Setingan Iphone",
      "Check VPN and Cast settings",
    ],
    hasImage: true,
    actionType: "On Site",
    priority: "High",
    slug: "no-device-logged"
  },
  {
    id: 10,
    category: "Kategori-10",
    device: "Chromecast",
    issue: "Chromecast Black Screen",
    solutions: ["Chromecast Power Adaptor Rusak", "Check Adaptor Chromecast"],
    hasImage: true,
    actionType: "System",
    priority: "Medium",
    slug: "chromecast-black-screen"
  },
  {
    id: 11,
    category: "Kategori-11",
    device: "Channel",
    issue: "Channel Not Found",
    solutions: ["LAN Out Terpasang bukan LAN In"],
    hasImage: true,
    actionType: "System",
    priority: "Low",
    slug: "channel-not-found"
  },
];

const deviceConfig: Record<string, DeviceConfig> = {
  IPTV: {
    icon: Monitor,
    color: "bg-blue-500",
    bgLight: "bg-blue-50",
    textColor: "text-blue-700",
  },
  Chromecast: {
    icon: Tv,
    color: "bg-red-500",
    bgLight: "bg-red-50",
    textColor: "text-red-700",
  },
  Channel: {
    icon: Radio,
    color: "bg-green-500",
    bgLight: "bg-green-50",
    textColor: "text-green-700",
  },
};

const Header: React.FC<HeaderProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <div className="relative cursor-pointer">
                <Image
                  src="/logo-black.png"
                  alt="Logo"
                  width={480}
                  height={480}
                  className="w-20 h-20 sm:w-26 sm:h-26 object-contain flex-shrink-0 filter drop-shadow-lg"
                />
                {/* Logo glow effect */}
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl opacity-30 animate-pulse" />
              </div>
            </Link>
          </div>

          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-full bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent shadow-sm text-sm"
                placeholder="Cari artikel bantuan..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
              />
            </div>
          </div>

          <div className="w-20"></div>
        </div>
      </div>
    </header>
  );
};

const FilterSection: React.FC<FilterSectionProps> = ({
  selectedDevice,
  setSelectedDevice,
  selectedCategory,
  setSelectedCategory,
  selectedIssue,
  setSelectedIssue,
}) => {
  const devices: string[] = ["Semua", "IPTV", "Chromecast", "Channel"];
  const categories: string[] = [
    "Semua",
    ...Array.from({ length: 11 }, (_, i) => `Kategori-${i + 1}`),
  ];
  const issues: string[] = [
    "Semua",
    ...Array.from(new Set(faqData.map((item) => item.issue))),
  ];

  return (
    <div className="bg-white border-b border-gray-100 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>

          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedCategory(e.target.value)
              }
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-w-[120px]"
            >
              {categories.map((category: string) => (
                <option key={category} value={category}>
                  {category === "Semua" ? "Kategori" : category}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={selectedDevice}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedDevice(e.target.value)
              }
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-w-[100px]"
            >
              {devices.map((device: string) => (
                <option key={device} value={device}>
                  {device === "Semua" ? "Type" : device}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={selectedIssue}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedIssue(e.target.value)
              }
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-w-[140px]"
            >
              {issues.slice(0, 10).map((issue: string) => (
                <option key={issue} value={issue}>
                  {issue === "Semua"
                    ? "Issue"
                    : issue.length > 20
                    ? issue.substring(0, 20) + "..."
                    : issue}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const deviceInfo: DeviceConfig | undefined = deviceConfig[article.device];
  const DeviceIcon: LucideIcon = deviceInfo?.icon || HelpCircle;

  return (
    <Link href={`/help/details/${article.slug}`}>
      <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 p-4">
        {/* Header dengan icon dan badges */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 ${deviceInfo?.color} rounded-lg flex items-center justify-center`}
            >
              <DeviceIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-900">
                  {article.category}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    article.actionType === "System"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {article.actionType}
                </span>
              </div>
              <div className="text-xs text-gray-500">{article.device}</div>
            </div>
          </div>
          <div
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              article.priority === "High"
                ? "bg-red-100 text-red-600"
                : article.priority === "Medium"
                ? "bg-yellow-100 text-yellow-600"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {article.priority}
          </div>
        </div>

        {/* Issue title */}
        <h3 className="font-medium text-gray-900 text-sm mb-3 leading-tight">
          {article.issue}
        </h3>

        {/* Screenshot placeholder */}
        {article.hasImage && (
          <div className="w-full h-20 bg-gray-100 rounded-md mb-3 flex items-center justify-center border border-dashed border-gray-300">
            <span className="text-xs text-gray-500 font-medium">
              Screenshot Tersedia
            </span>
          </div>
        )}

        {/* Solutions */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Solusi
          </div>
          <div className="space-y-1">
            {article.solutions
              .slice(0, 3)
              .map((solution: string, index: number) => (
                <div
                  key={index}
                  className="text-xs text-gray-600 flex items-start"
                >
                  <span className="w-1 h-1 bg-rose-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                  <span className="leading-relaxed">{solution}</span>
                </div>
              ))}
            {article.solutions.length > 3 && (
              <div className="text-xs text-gray-400 font-medium">
                +{article.solutions.length - 3} solusi lainnya
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

const HelpPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDevice, setSelectedDevice] = useState<string>("Semua");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [selectedIssue, setSelectedIssue] = useState<string>("Semua");

  const filteredArticles: FAQ[] = useMemo(() => {
    return faqData.filter((article: FAQ) => {
      const matchesSearch =
        searchQuery === "" ||
        article.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.solutions.some((solution: string) =>
          solution.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        article.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDevice =
        selectedDevice === "Semua" || article.device === selectedDevice;
      const matchesCategory =
        selectedCategory === "Semua" || article.category === selectedCategory;
      const matchesIssue =
        selectedIssue === "Semua" || article.issue === selectedIssue;

      return matchesSearch && matchesDevice && matchesCategory && matchesIssue;
    });
  }, [searchQuery, selectedDevice, selectedCategory, selectedIssue]);

  const deviceStats: Record<string, number> = useMemo(() => {
    return {
      IPTV: faqData.filter((item: FAQ) => item.device === "IPTV").length,
      Chromecast: faqData.filter((item: FAQ) => item.device === "Chromecast")
        .length,
      Channel: faqData.filter((item: FAQ) => item.device === "Channel").length,
    };
  }, []);

  const handleResetFilters = (): void => {
    setSelectedDevice("Semua");
    setSelectedCategory("Semua");
    setSelectedIssue("Semua");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <FilterSection
        selectedDevice={selectedDevice}
        setSelectedDevice={setSelectedDevice}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedIssue={selectedIssue}
        setSelectedIssue={setSelectedIssue}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Pusat Bantuan Teknis
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Temukan solusi cepat untuk masalah IPTV, Chromecast, dan Channel
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {Object.entries(deviceStats).map(
            ([device, count]: [string, number]) => {
              const config: DeviceConfig = deviceConfig[device];
              const Icon: LucideIcon = config.icon;
              return (
                <div
                  key={device}
                  className="bg-white rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 ${config.bgLight} rounded-lg flex items-center justify-center`}
                    >
                      <Icon className={`w-5 h-5 ${config.textColor}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{device}</h3>
                      <p className="text-sm text-gray-500">{count} artikel</p>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {filteredArticles.length} artikel ditemukan
          </h2>
        </div>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak ada artikel ditemukan
            </h3>
            <p className="text-gray-500 mb-4">
              Coba ubah filter atau kata kunci pencarian
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredArticles.map((article: FAQ) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>

      {/* Footer - Made smaller and more compact */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <p className="text-gray-400 text-xs">
              © 2025 Radisson Blu Uluwatu. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HelpPage;
