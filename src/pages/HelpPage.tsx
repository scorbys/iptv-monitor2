"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  Monitor,
  Tv,
  Radio,
  HelpCircle,
} from "lucide-react";

// Mock data berdasarkan screenshot
const faqData = [
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
    image: "/images/chromecast-1.jpg",
    actionType: "System",
  },
  {
    id: 2,
    category: "Kategori-2",
    device: "IPTV",
    issue: "Weak Or No Signal",
    solutions: [
      "Tidak ada Power Chromecast",
      "Kabel LAN no Connect",
      "Source HDMI Must be HDMI -1",
    ],
    image: "/images/iptv-signal.jpg",
    actionType: "On Site",
  },
  {
    id: 3,
    category: "Kategori-3",
    device: "IPTV",
    issue: "Undefined",
    solutions: [
      "Source HDMI Must HDMI -1",
      "Restart LAN (Reumplug) &",
      "H Browser tidak aktif",
    ],
    image: "/images/iptv-undefined.jpg",
    actionType: "On Site",
  },
  {
    id: 4,
    category: "Kategori-4",
    device: "Channel",
    issue: "TV Stuck",
    solutions: ["Restart TV & Replace Adaptor"],
    image: null,
    actionType: "System",
  },
  {
    id: 5,
    category: "Kategori-5",
    device: "Channel",
    issue: "Error Playing",
    solutions: ["Channel issue dari Biznet (Testing VIA VLC)"],
    image: "/images/error-playing.jpg",
    actionType: "System",
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
    image: "/images/player-error.jpg",
    actionType: "System",
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
    image: null,
    actionType: "System",
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
    image: "/images/chromecast-reset.jpg",
    actionType: "On Site",
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
    image: "/images/device-logged.jpg",
    actionType: "On Site",
  },
  {
    id: 10,
    category: "Kategori-10",
    device: "Chromecast",
    issue: "Chromecast Black Screen",
    solutions: ["Chromecast Power Adaptor Rusak", "Check Adaptor Chromecast"],
    image: "/images/black-screen.jpg",
    actionType: "System",
  },
  {
    id: 11,
    category: "Kategori-11",
    device: "Channel",
    issue: "Channel Not Found",
    solutions: ["LAN Out Terpasang bukan LAN IN"],
    image: "/images/channel-not-found.jpg",
    actionType: "System",
  },
];

const deviceIcons = {
  IPTV: Monitor,
  Chromecast: Tv,
  Channel: Radio,
};

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
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

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-transparent focus:bg-white sm:text-sm"
                placeholder="Cari artikel bantuan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Right side - could add user menu here */}
          <div className="w-20"></div>
        </div>
      </div>
    </header>
  );
};

interface FilterSectionProps {
  selectedDevice: string;
  setSelectedDevice: (device: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  selectedDevice,
  setSelectedDevice,
  selectedCategory,
  setSelectedCategory,
}) => {
  const devices = ["Semua", "IPTV", "Chromecast", "Channel"];
  const categories = [
    "Semua",
    ...Array.from({ length: 11 }, (_, i) => `Kategori-${i + 1}`),
  ];

  return (
    <div className="bg-white border-b border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-4">
          {/* Device Filter */}
          <div className="relative">
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              {devices.map((device) => (
                <option key={device} value={device}>
                  {device}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

interface Article {
  id: number;
  category: string;
  device: string;
  issue: string;
  solutions: string[];
  image: string | null;
  actionType: string;
}

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const DeviceIcon =
    deviceIcons[article.device as keyof typeof deviceIcons] || HelpCircle;

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-lg group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <DeviceIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-rose-600 transition-colors">
                {article.category}
              </h3>
              <p className="text-sm text-gray-500">{article.device}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              article.actionType === "System"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {article.actionType}
          </span>
        </div>

        {/* Issue */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">{article.issue}</h4>
        </div>

        {/* Image */}
        {article.image && (
          <div className="mb-4">
            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-gray-400 text-sm">Screenshot Preview</div>
            </div>
          </div>
        )}

        {/* Solutions */}
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-700">Solusi:</h5>
          <ul className="space-y-1">
            {article.solutions.map((solution, index) => (
              <li
                key={index}
                className="text-sm text-gray-600 flex items-start"
              >
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                {solution}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const HelpPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("Semua");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const filteredArticles = useMemo(() => {
    return faqData.filter((article) => {
      const matchesSearch =
        searchQuery === "" ||
        article.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.solutions.some((solution) =>
          solution.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        article.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDevice =
        selectedDevice === "Semua" || article.device === selectedDevice;
      const matchesCategory =
        selectedCategory === "Semua" || article.category === selectedCategory;

      return matchesSearch && matchesDevice && matchesCategory;
    });
  }, [searchQuery, selectedDevice, selectedCategory]);

  const groupedArticles = useMemo(() => {
    return filteredArticles.reduce(
      (groups: Record<string, Article[]>, article) => {
        const device = article.device;
        if (!groups[device]) {
          groups[device] = [];
        }
        groups[device].push(article);
        return groups;
      },
      {}
    );
  }, [filteredArticles]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <FilterSection
        selectedDevice={selectedDevice}
        setSelectedDevice={setSelectedDevice}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pusat Bantuan Teknis
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Temukan solusi untuk masalah teknis perangkat IPTV, Chromecast, dan
            Channel Anda
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Monitor className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">IPTV</h3>
            <p className="text-sm text-gray-500">
              {faqData.filter((item) => item.device === "IPTV").length} artikel
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Tv className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Chromecast</h3>
            <p className="text-sm text-gray-500">
              {faqData.filter((item) => item.device === "Chromecast").length}{" "}
              artikel
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Radio className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Channel</h3>
            <p className="text-sm text-gray-500">
              {faqData.filter((item) => item.device === "Channel").length}{" "}
              artikel
            </p>
          </div>
        </div>

        {/* Results */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak ada artikel ditemukan
            </h3>
            <p className="text-gray-500">
              Coba ubah kata kunci pencarian atau filter yang Anda gunakan
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedArticles).map(([device, articles]) => (
              <div key={device}>
                <div className="flex items-center mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
                      {React.createElement(
                        deviceIcons[device as keyof typeof deviceIcons] ||
                          HelpCircle,
                        { className: "w-4 h-4 text-white" }
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {device}
                    </h2>
                  </div>
                  <div className="ml-4 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                    {articles.length} artikel
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              © 2025 Radisson Blu Uluwatu. Semua hak asasi manusia dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HelpPage;
