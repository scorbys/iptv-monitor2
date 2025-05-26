"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BellIcon, HomeModernIcon } from "@heroicons/react/24/outline";
import { AvatarIcon, GearIcon, ExitIcon } from "@radix-ui/react-icons";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@radix-ui/themes";

export default function Topbar() {
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Sample notifications
  const notifications = [
    {
      id: 1,
      title: "Server Alert",
      message: "IPTV Server #2 is experiencing high load",
      time: "2 min ago",
      type: "warning",
    },
    {
      id: 2,
      title: "Channel Update",
      message: "New channels added to the lineup",
      time: "1 hour ago",
      type: "info",
    },
    {
      id: 3,
      title: "System Maintenance",
      message: "Scheduled maintenance completed successfully",
      time: "3 hours ago",
      type: "success",
    },
  ];

  return (
    <header className="w-full h-[50px] bg-gray-100 flex items-center justify-between px-6">
      {/* Left Section - Brand */}
      <div className="flex items-center gap-3">
        <HomeModernIcon className="w-6 h-6 text-blue-600" />
        <h1 className="text-lg font-medium text-gray-900">IPTV System Monitoring</h1>
      </div>

      {/* Right Section - Notifications & Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <DropdownMenu.Root
          open={notificationOpen}
          onOpenChange={setNotificationOpen}
        >
          <DropdownMenu.Trigger asChild>
            <div className="relative">
              <Button
                variant="ghost"
                size="2"
                className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <BellIcon className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
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

              {notifications.map((notification) => (
                <DropdownMenu.Item key={notification.id} asChild>
                  <div className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === "warning"
                            ? "bg-yellow-500"
                            : notification.type === "success"
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                </DropdownMenu.Item>
              ))}

              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700">
                <button className="text-sm text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300 font-medium">
                  View all notifications
                </button>
              </div>

              <DropdownMenu.Arrow className="fill-white dark:fill-slate-800" />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Profile Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-200">
                <AvatarIcon className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Admin</span>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-48 bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50"
              sideOffset={5}
              align="end"
            >
              <DropdownMenu.Item asChild>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <GearIcon className="w-4 h-4" />
                  Settings
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />

              <DropdownMenu.Item asChild>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded cursor-pointer">
                  <ExitIcon className="w-4 h-4" />
                  Sign Out
                </button>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
