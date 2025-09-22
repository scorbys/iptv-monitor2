"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
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

interface ModernDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  label: string;
  color?: "blue" | "green" | "purple" | "gray";
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
    slug: "no-device-found-chromecast",
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
    slug: "weak-or-no-signal",
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
    slug: "unplug-lan-tv",
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
    slug: "chromecast-setup-ios",
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
    slug: "error-playing",
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
    slug: "error-player-error",
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
    slug: "connection-failure",
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
    slug: "reset-configuration",
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
    slug: "no-device-logged",
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
    slug: "chromecast-black-screen",
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
    slug: "channel-not-found",
  },
];

const deviceConfig: Record<string, DeviceConfig> = {
  IPTV: {
    icon: Monitor,
    color: "bg-blue-600",
    bgLight: "bg-blue-50",
    textColor: "text-blue-700",
  },
  Chromecast: {
    icon: Tv,
    color: "bg-red-600",
    bgLight: "bg-red-50",
    textColor: "text-red-700",
  },
  Channel: {
    icon: Radio,
    color: "bg-green-600",
    bgLight: "bg-green-50",
    textColor: "text-green-700",
  },
};

const getAvailableOptions = (
  currentFilters: {
    device: string;
    category: string;
    issue: string;
  },
  filterType: "device" | "category" | "issue"
) => {
  const filteredData = faqData.filter((item) => {
    if (filterType !== "device" && currentFilters.device !== "Semua") {
      if (item.device !== currentFilters.device) return false;
    }
    if (filterType !== "category" && currentFilters.category !== "Semua") {
      if (item.category !== currentFilters.category) return false;
    }
    if (filterType !== "issue" && currentFilters.issue !== "Semua") {
      if (item.issue !== currentFilters.issue) return false;
    }
    return true;
  });

  switch (filterType) {
    case "device":
      return [
        "Semua",
        ...Array.from(new Set(filteredData.map((item) => item.device))),
      ];
    case "category":
      return [
        "Semua",
        ...Array.from(new Set(filteredData.map((item) => item.category))),
      ];
    case "issue":
      return [
        "Semua",
        ...Array.from(new Set(filteredData.map((item) => item.issue))),
      ];
    default:
      return ["Semua"];
  }
};

const improvedSearch = (searchQuery: string, article: FAQ): boolean => {
  if (searchQuery === "") return true;

  const query = searchQuery.toLowerCase().trim();
  const searchTerms = query.split(/\s+/);

  const searchableText = [
    article.issue,
    article.device,
    article.category,
    article.actionType,
    article.priority,
    ...article.solutions,
  ]
    .join(" ")
    .toLowerCase();

  return searchTerms.every((term) => searchableText.includes(term));
};

const EnhancedSearchBar: React.FC<{
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  suggestions?: string[];
}> = ({ searchQuery, setSearchQuery, suggestions = [] }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  React.useEffect(() => {
    if (searchQuery.length > 1) {
      const filtered = suggestions
        .filter((suggestion) =>
          suggestion.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5);
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [searchQuery, suggestions]);

  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
        <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-colors group-focus-within:text-blue-600" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm font-medium"
        placeholder="Cari masalah, device, atau solusi..."
        value={searchQuery}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setSearchQuery(e.target.value)
        }
        onFocus={() => setShowSuggestions(filteredSuggestions.length > 0)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 sm:max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 text-xs sm:text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
              onClick={() => {
                setSearchQuery(suggestion);
                setShowSuggestions(false);
              }}
            >
              <span className="line-clamp-2">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ModernDropdown: React.FC<ModernDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder,
  icon,
  disabled = false,
  label,
  color = "blue",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const colorVariants = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      hover: "hover:bg-blue-100",
      focus: "focus:ring-blue-500/20 focus:border-blue-500",
      accent: "bg-blue-500",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
      hover: "hover:bg-green-100",
      focus: "focus:ring-green-500/20 focus:border-green-500",
      accent: "bg-green-500",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-700",
      hover: "hover:bg-purple-100",
      focus: "focus:ring-purple-500/20 focus:border-purple-500",
      accent: "bg-purple-500",
    },
    gray: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      text: "text-gray-700",
      hover: "hover:bg-gray-100",
      focus: "focus:ring-gray-500/20 focus:border-gray-500",
      accent: "bg-gray-500",
    },
  };

  const currentColor = colorVariants[color];
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const displayValue = value === "Semua" ? placeholder : value;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wider">
        {label}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          relative w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3.5 text-left
          bg-white border-2 rounded-xl sm:rounded-2xl shadow-sm
          transition-all duration-300 ease-out
          ${
            disabled
              ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
              : `${currentColor.border} ${currentColor.focus} hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 cursor-pointer`
          }
          ${isOpen ? `${currentColor.focus} shadow-lg` : ""}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {icon && (
              <div
                className={`p-1 sm:p-1.5 rounded-lg ${currentColor.bg} ${
                  disabled ? "opacity-50" : ""
                } flex-shrink-0`}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span
                className={`block text-xs sm:text-sm font-medium ${
                  disabled ? "text-gray-400" : "text-gray-900"
                } truncate`}
              >
                {displayValue}
              </span>
              {value !== "Semua" && (
                <div
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${currentColor.accent} rounded-full mt-0.5 sm:mt-1`}
                ></div>
              )}
            </div>
          </div>

          <ChevronDown
            className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 flex-shrink-0 ${
              disabled ? "text-gray-400" : "text-gray-500"
            } ${isOpen ? "rotate-180" : ""}`}
          />
        </div>

        {/* Active indicator */}
        {value !== "Semua" && !disabled && (
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 sm:w-1 h-6 sm:h-8 ${currentColor.accent} rounded-r-full`}
          ></div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-[60] w-full mt-2 bg-white border-2 border-gray-100 rounded-xl sm:rounded-2xl shadow-2xl shadow-gray-900/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="max-h-48 sm:max-h-64 overflow-y-auto">
            {options.map((option, index) => {
              const isSelected = option === value;
              const isDefault = option === "Semua";

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={`
              w-full px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium
              transition-all duration-200 flex items-center justify-between
              ${
                isSelected
                  ? `${currentColor.bg} ${currentColor.text} shadow-sm`
                  : "text-gray-700 hover:bg-gray-50"
              }
              ${index === 0 ? "" : "border-t border-gray-50"}
            `}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    {!isDefault && (
                      <div
                        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${
                          isSelected ? currentColor.accent : "bg-gray-300"
                        }`}
                      ></div>
                    )}
                    <span
                      className={`truncate ${isDefault ? "font-semibold" : ""}`}
                    >
                      {isDefault ? placeholder : option}
                    </span>
                  </div>

                  {isSelected && (
                    <div
                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full ${currentColor.accent} flex items-center justify-center flex-shrink-0`}
                    >
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              );
            })}

            {filteredOptions.length === 0 && (
              <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-gray-500 text-xs sm:text-sm">
                <Search className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-300" />
                Tidak ada opsi ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({ searchQuery, setSearchQuery }) => {
  const suggestions = useMemo(() => {
    const allSuggestions = [
      ...faqData.map((item) => item.issue),
      ...faqData.map((item) => item.device),
      ...faqData.flatMap((item) => item.solutions),
    ];
    return [...new Set(allSuggestions)];
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/dashboard">
              <div className="relative cursor-pointer group">
                <Image
                  src="/logo-black.png"
                  alt="Logo"
                  width={480}
                  height={480}
                  className="w-16 h-16 sm:w-20 sm:h-20 lg:w-28 lg:h-28 object-contain transition-all duration-300 group-hover:scale-105"
                />
              </div>
            </Link>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md sm:max-w-2xl mx-2 sm:mx-8 relative">
            <EnhancedSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              suggestions={suggestions}
            />
          </div>

          {/* Spacer untuk balance - hide di mobile */}
          <div className="w-0 sm:w-16"></div>
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
  const currentFilters = {
    device: selectedDevice,
    category: selectedCategory,
    issue: selectedIssue,
  };

  const availableDevices = useMemo(
    () => getAvailableOptions(currentFilters, "device"),
    [selectedCategory, selectedIssue]
  );

  const availableCategories = useMemo(
    () => getAvailableOptions(currentFilters, "category"),
    [selectedDevice, selectedIssue]
  );

  const availableIssues = useMemo(
    () => getAvailableOptions(currentFilters, "issue"),
    [selectedDevice, selectedCategory]
  );

  React.useEffect(() => {
    if (!availableDevices.includes(selectedDevice)) {
      setSelectedDevice("Semua");
    }
  }, [availableDevices, selectedDevice, setSelectedDevice]);

  React.useEffect(() => {
    if (!availableCategories.includes(selectedCategory)) {
      setSelectedCategory("Semua");
    }
  }, [availableCategories, selectedCategory, setSelectedCategory]);

  React.useEffect(() => {
    if (!availableIssues.includes(selectedIssue)) {
      setSelectedIssue("Semua");
    }
  }, [availableIssues, selectedIssue, setSelectedIssue]);

  const activeFiltersCount = [
    selectedDevice,
    selectedCategory,
    selectedIssue,
  ].filter((filter) => filter !== "Semua").length;

  return (
    <div className="bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-sm border-b border-gray-100/50 py-4 sm:py-8 relative z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg shadow-blue-500/25">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Filter Pencarian
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Persempit hasil pencarian Anda
                </p>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="flex items-center space-x-2">
                <div className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  {activeFiltersCount} filter aktif
                </div>
              </div>
            )}
          </div>

          {/* Clear All Button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={() => {
                setSelectedDevice("Semua");
                setSelectedCategory("Semua");
                setSelectedIssue("Semua");
              }}
              className="group px-3 sm:px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-xl border-2 border-red-200 hover:border-red-300 transition-all duration-200 font-medium text-sm flex items-center justify-center sm:justify-start space-x-2 w-full sm:w-auto"
            >
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <div className="w-2 h-0.5 bg-white rounded-full"></div>
              </div>
              <span>Reset Semua</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          <ModernDropdown
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={availableCategories}
            placeholder="Category"
            disabled={availableCategories.length <= 1}
            label="Category"
            color="blue"
            icon={<div className="w-4 h-4 bg-blue-500 rounded"></div>}
          />

          <ModernDropdown
            value={selectedDevice}
            onChange={setSelectedDevice}
            options={availableDevices}
            placeholder="Devices"
            disabled={availableDevices.length <= 1}
            label="Devices"
            color="green"
            icon={<Monitor className="w-4 h-4 text-green-600" />}
          />

          <ModernDropdown
            value={selectedIssue}
            onChange={setSelectedIssue}
            options={availableIssues}
            placeholder="Issues"
            disabled={availableIssues.length <= 1}
            label="Issues"
            color="purple"
            icon={<HelpCircle className="w-4 h-4 text-purple-600" />}
          />
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/50">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm font-semibold text-gray-700">
                Filter Aktif:
              </span>

              {selectedCategory !== "Semua" && (
                <div className="group flex items-center space-x-2 px-2 sm:px-3 py-1 sm:py-2 bg-blue-100 text-blue-800 rounded-lg sm:rounded-xl border border-blue-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium">
                    {selectedCategory}
                  </span>
                  <button
                    onClick={() => setSelectedCategory("Semua")}
                    className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-200 hover:bg-blue-300 rounded-full flex items-center justify-center transition-colors"
                  >
                    <div className="w-1.5 h-0.5 sm:w-2 sm:h-0.5 bg-blue-700 rounded-full"></div>
                  </button>
                </div>
              )}

              {selectedDevice !== "Semua" && (
                <div className="group flex items-center space-x-2 px-2 sm:px-3 py-1 sm:py-2 bg-green-100 text-green-800 rounded-lg sm:rounded-xl border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium">{selectedDevice}</span>
                  <button
                    onClick={() => setSelectedDevice("Semua")}
                    className="w-3 h-3 sm:w-4 sm:h-4 bg-green-200 hover:bg-green-300 rounded-full flex items-center justify-center transition-colors"
                  >
                    <div className="w-1.5 h-0.5 sm:w-2 sm:h-0.5 bg-green-700 rounded-full"></div>
                  </button>
                </div>
              )}

              {selectedIssue !== "Semua" && (
                <div className="group flex items-center space-x-2 px-2 sm:px-3 py-1 sm:py-2 bg-purple-100 text-purple-800 rounded-lg sm:rounded-xl border border-purple-200">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-xs font-medium max-w-[80px] sm:max-w-[120px] truncate">
                    {selectedIssue.length > 15
                      ? selectedIssue.substring(0, 15) + "..."
                      : selectedIssue}
                  </span>
                  <button
                    onClick={() => setSelectedIssue("Semua")}
                    className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-200 hover:bg-purple-300 rounded-full flex items-center justify-center transition-colors"
                  >
                    <div className="w-1.5 h-0.5 sm:w-2 sm:h-0.5 bg-purple-700 rounded-full"></div>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const deviceInfo: DeviceConfig | undefined = deviceConfig[article.device];
  const DeviceIcon: LucideIcon = deviceInfo?.icon || HelpCircle;

  return (
    <Link href={`/help/details/${article.slug}`}>
      <div className="group bg-white rounded-xl sm:rounded-2xl border-2 border-gray-100 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-200/20 transition-all duration-300 p-3 sm:p-5 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 ${deviceInfo?.color} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
            >
              <DeviceIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <span className="text-xs font-bold text-gray-900 bg-gray-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs truncate">
                  {article.category}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <span
                  className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-medium ${
                    article.actionType === "System"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {article.actionType}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
                  {article.device}
                </span>
              </div>
            </div>
          </div>
          <div
            className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-bold flex-shrink-0 ${
              article.priority === "High"
                ? "bg-red-500 text-white"
                : article.priority === "Medium"
                ? "bg-yellow-500 text-white"
                : "bg-gray-500 text-white"
            }`}
          >
            {article.priority}
          </div>
        </div>

        {/* Issue title  */}
        <h3 className="font-bold text-gray-900 text-xs sm:text-sm mb-3 sm:mb-4 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
          {article.issue}
        </h3>

        {/* Screenshot placeholder */}
        {article.hasImage && (
          <div className="relative w-full h-12 sm:h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg sm:rounded-xl mb-3 sm:mb-4 flex items-center justify-center border-2 border-dashed border-blue-200 group-hover:border-blue-300 transition-colors overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
            <div className="relative flex items-center gap-1">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] sm:text-xs text-blue-700 font-bold">
                Guide Available
              </span>
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-indigo-500 rounded-full animate-pulse delay-100"></div>
            </div>
          </div>
        )}

        {/* Solutions */}
        <div className="flex-1 space-y-2 sm:space-y-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-0.5 sm:w-1 h-2 sm:h-3 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
            <span className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
              Solusi
            </span>
          </div>
          <div className="space-y-1 sm:space-y-1.5">
            {article.solutions
              .slice(0, 4) // Batasi hanya 4 solusi
              .map((solution: string, index: number) => (
                <div
                  key={index}
                  className="text-[10px] sm:text-xs text-gray-700 flex items-start group/item"
                >
                  <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-blue-500 rounded-full mt-1.5 mr-1.5 sm:mr-2 flex-shrink-0 group-hover/item:bg-indigo-500 transition-colors"></div>
                  <span className="leading-relaxed font-medium group-hover/item:text-gray-900 transition-colors line-clamp-2">
                    {solution}
                  </span>
                </div>
              ))}
            {article.solutions.length > 2 && (
              <div className="text-[10px] sm:text-xs text-blue-600 font-bold bg-blue-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg inline-block">
                +{article.solutions.length - 2} lainnya
              </div>
            )}
          </div>
        </div>

        {/* Hover effect indicator */}
        <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <span className="text-gray-500 font-medium">Lihat detail</span>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-100 rounded-full flex items-center justify-center">
              <ChevronDown className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-blue-600 rotate-[-90deg]" />
            </div>
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
      const matchesSearch = improvedSearch(searchQuery, article);
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

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedDevice !== "Semua" ||
    selectedCategory !== "Semua" ||
    selectedIssue !== "Semua";

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

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Hero & Stats */}
        {!hasActiveFilters && (
          <>
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Pusat Bantuan Teknis
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                Temukan solusi cepat untuk masalah IPTV, Chromecast, dan Channel
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              {Object.entries(deviceStats).map(([device, count]) => {
                const config: DeviceConfig = deviceConfig[device];
                const Icon: LucideIcon = config.icon;

                return (
                  <div
                    key={device}
                    className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 ${config.color} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                          {device}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 font-medium">
                          {count} artikel tersedia
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Summary untuk filter aktif */}
        {hasActiveFilters && (
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {filteredArticles.length} artikel ditemukan
            </h2>
          </div>
        )}

        {/* Results Grid */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12 sm:py-16 px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              Tidak ada artikel ditemukan
            </h3>
            <p className="text-sm sm:text-base text-gray-500 mb-4">
              Coba ubah filter atau kata kunci pencarian
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 text-sm font-medium"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredArticles.map((article: FAQ) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="text-center">
            <p className="text-gray-500 text-[10px] sm:text-xs">
              © 2025 Radisson Blu Uluwatu. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HelpPage;
