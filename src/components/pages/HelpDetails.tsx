"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Monitor,
  Tv,
  Radio,
  HelpCircle,
  CheckCircle2,
  RefreshCw,
  LucideIcon,
  ImageIcon,
  Settings,
  AlertCircle,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ChevronDown,
} from "lucide-react";

// Types
interface FAQ {
  id: number;
  category: string;
  device: string;
  issue: string;
  solutions: string[];
  detailedSteps: string[];
  troubleshooting: string[];
  hasImage: boolean;
  slug: string;
  images?: string[];
  visualGuideImages?: string[];
  quickInfoImages?: string[];
}

interface DeviceConfig {
  icon: LucideIcon;
  color: string;
  bgLight: string;
  textColor: string;
}

interface ImageModalProps {
  isOpen: boolean;
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onImageClick: (index: number) => void;
}

// Component Props Interfaces
interface ModernVisualGuideProps {
  article: FAQ;
  openImageModal: (index: number) => void;
}

interface ModernQuickInfoProps {
  article: FAQ;
  openImageModal: (index: number) => void;
}

interface ModernTroubleshootingProps {
  article: FAQ;
}

interface ModernStepGuideProps {
  article: FAQ;
  completedSteps: number[];
  toggleStepCompletion: (stepIndex: number) => void;
}

interface ModernStepItemProps {
  step: string;
  index: number;
  completedSteps: number[];
  toggleStepCompletion: (stepIndex: number) => void;
}

interface ModernHeaderProps {
  router: ReturnType<typeof useRouter>;
  article: FAQ;
}

interface ModernArticleHeaderProps {
  article: FAQ;
  deviceInfo: DeviceConfig;
  DeviceIcon: LucideIcon;
  completionPercentage: number;
  totalSteps: number;
  completedSteps: number[];
  resetProgress: () => void;
}

// Mock data with more articles
const faqData: FAQ[] = [
  {
    id: 1,
    category: "Kategori-1",
    device: "Chromecast",
    issue: "No Device Found Chromecast",
    solutions: [
      "Deactivate the whitelist profile",
      "Restart Chromecast & WiFi",
      "Radisson Guest must be logged in",
      "Forget the Radisson Guest WiFi",
      "Log out of WiFi (log-out.me)",
    ],
    detailedSteps: [
      "Open the Google Home app on your iOS device",
      "Make sure the Chromecast and iOS device are on the same WiFi network",
      "In the iPhone settings, open Settings > Privacy & Security > Local Network",
      "Enable Local Network access for the Google Home app",
      "Log out of the Radisson Guest WiFi, then log back in with the correct credentials",
      "Restart the Chromecast by unplugging and reconnecting the power adapter",
      "Open a browser and go to log-out.me to ensure there are no conflicting sessions",
      "Try setting up the Chromecast again via the Google Home app",
    ],
    troubleshooting: [
      "If it's still not detected, try resetting the Chromecast to factory settings",
      "Make sure no VPN is active on the iOS device",
      "Check whether the hotel firewall is blocking the Chromecast connection",
    ],
    hasImage: true,
    slug: "no-device-found-chromecast",
    images: [
      "/placeholder/100.jpeg",
      "/placeholder/101.jpeg",
      "/placeholder/cat-1.jpeg",
    ],
    visualGuideImages: ["/placeholder/100.jpeg", "/placeholder/101.jpeg"],
    quickInfoImages: ["/placeholder/cat-1.jpeg"],
  },
  {
    id: 2,
    category: "Kategori-2",
    device: "IPTV",
    issue: "Weak Or No Signal",
    solutions: [
      "Check the LAN connection on the TV",
      "Make sure the HDMI source is set to HDMI-1",
      "Restart the IPTV device",
      "Check the LED indicator on the IPTV box",
    ],
    detailedSteps: [
      "Check whether the LAN cable is firmly seated in the correct port",
      "Make sure the LAN cable is connected to the 'LAN IN' port, not 'LAN OUT'",
      "On the TV remote, press the 'Source' or 'Input' button",
      "Pilih HDMI-1 sebagai sumber input",
      "Unplug the IPTV box power adapter for 10 seconds, then plug it back in",
      "Wait until the LED indicator turns green (about 2-3 minutes)",
      "If the LED is still red or blinking, check the internet connection",
      "Test the connection by swapping the LAN cable if available",
    ],
    troubleshooting: [
      "If it's still weak, check the LAN cable for physical damage",
      "Make sure there is no excessive bending of the cable",
      "Try a different LAN port if available on the wall outlet",
    ],
    hasImage: true,
    slug: "weak-or-no-signal",
    images: [
      "/placeholder/23110.jpeg",
      "/placeholder/23111.jpeg",
      "/placeholder/cat-2.jpeg",
    ],
    visualGuideImages: ["/placeholder/23110.jpeg", "/placeholder/23111.jpeg"],
    quickInfoImages: ["/placeholder/cat-2.jpeg"],
  },
  {
    id: 3,
    category: "Kategori-3",
    device: "IPTV",
    issue: "Unplug LAN TV",
    solutions: [
      "Check the LAN connection (make sure it's plugged into LAN IN)",
      "Position the LAN cable correctly",
      "Make sure it's not plugged into LAN OUT",
      "Test the connection with another LAN cable",
    ],
    detailedSteps: [
      "Turn off the TV and IPTV box first",
      "Disconnect the LAN cable from the IPTV box",
      "Check the ports on the IPTV box, look for 'LAN IN' or 'ETHERNET IN'",
      "Make sure the LAN cable is plugged into the 'LAN IN' port, not 'LAN OUT'",
      "Push the cable until you hear a 'click' indicating it's firmly seated",
      "Check that the cable end connected to the wall outlet is also firmly seated",
      "Turn the IPTV box back on and wait for booting to finish",
      "Turn on the TV and set the input to HDMI-1",
      "If it still has issues, try a spare LAN cable",
    ],
    troubleshooting: [
      "Check whether the RJ45 connector is damaged",
      "Make sure there is no dust or dirt inside the port",
      "If available, test with a different LAN cable",
    ],
    hasImage: true,
    slug: "unplug-lan-tv",
    images: [
      "/placeholder/23110.jpeg",
      "/placeholder/23111.jpeg",
      "/placeholder/cat-3.jpeg",
    ],
    visualGuideImages: ["/placeholder/23110.jpeg", "/placeholder/23111.jpeg"],
    quickInfoImages: ["/placeholder/cat-3.jpeg"],
  },
  {
    id: 4,
    category: "Kategori-4",
    device: "Chromecast",
    issue: "Chromecast Setup iOS",
    solutions: [
      "Install Google Home app",
      "Make sure the devices are on the same WiFi network",
      "Allow local network access on the iPhone",
      "Follow the setup wizard in the app",
    ],
    detailedSteps: [
      "Download and install the Google Home app from the App Store",
      "Make sure the Chromecast is connected to the TV via HDMI and is powered",
      "Open Settings on the iPhone > Privacy & Security > Local Network",
      "Enable the toggle for the Google Home app",
      "Open the Google Home app and sign in with a Google account",
      "Tap the '+' button to add a new device",
      "Pilih 'Set up device' > 'New devices'",
      "Select the home/location where the Chromecast will be set up",
      "The app will search for nearby Chromecasts",
      "Follow the on-screen instructions to complete the setup",
      "Connect the Chromecast to the 'Radisson Guest' WiFi",
      "Enter the WiFi password if prompted",
    ],
    troubleshooting: [
      "If the Chromecast is not detected, restart the Google Home app",
      "Make sure the iPhone and Chromecast are on the same WiFi",
      "If setup fails, reset the Chromecast by holding the button on the device for 25 seconds",
    ],
    hasImage: true,
    slug: "chromecast-setup-ios",
    images: ["/placeholder/400.jpeg", "/placeholder/cat-4.jpeg"],
    visualGuideImages: ["/placeholder/400.jpeg"],
    quickInfoImages: ["/placeholder/cat-4.jpeg"],
  },
  {
    id: 5,
    category: "Kategori-5",
    device: "Channel",
    issue: "Error Playing",
    solutions: ["Channel issue dari Biznet (Testing VIA VLC)"],
    detailedSteps: [
      "Open the VLC Media Player app",
      "Select the 'Media' menu > 'Open Network Stream'",
      "Enter the URL of the problematic channel",
      "Click 'Play' to test streaming",
      "If VLC can play it, the issue is in the IPTV app",
      "If VLC cannot, the issue is with the provider (Biznet)",
      "Contact technical support to confirm the channel",
      "Report the VLC test result to the support team",
    ],
    troubleshooting: [
      "Try another channel to confirm there is no network issue",
      "Check the internet speed with a speed test",
      "Restart the modem/router if needed",
    ],
    hasImage: true,
    slug: "error-playing",
    images: [
      "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f3e5f5'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%237b1fa2' font-size='16'%3EVLC Testing Method%3C/text%3E%3C/svg%3E",
      "/placeholder/cat-5.jpeg",
    ],
    visualGuideImages: [
      "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f3e5f5'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%237b1fa2' font-size='16'%3EVLC Testing Method%3C/text%3E%3C/svg%3E",
    ],
    quickInfoImages: ["/placeholder/cat-5.jpeg"],
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
    detailedSteps: [
      "Identify the type of error that appears",
      "Check the HBrowser configuration on the set-top box",
      "Open the IPTV app settings menu",
      "Find the 'Widget' or 'Player Settings' option",
      "Reset the widget configuration to default",
      "Restart the IPTV app after the change",
      "Test the problematic channel",
      "If it still errors, test with VLC as in the previous procedure",
    ],
    troubleshooting: [
      "Back up the configuration before performing a reset",
      "Note the working settings for reference",
      "Contact support if the error persists after a reset",
    ],
    hasImage: true,
    slug: "error-player-error",
    images: [
      "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23fff8e1'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23f57f17' font-size='16'%3EHbrowser Error%3C/text%3E%3C/svg%3E",
      "/placeholder/cat-6.jpeg",
    ],
    visualGuideImages: [
      "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23fff8e1'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23f57f17' font-size='16'%3EHbrowser Error%3C/text%3E%3C/svg%3E",
    ],
    quickInfoImages: ["/placeholder/cat-6.jpeg"],
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
    detailedSteps: [
      "Identify the cause of the connection failure",
      "Check the internet connection status",
      "Open the network settings on the set-top box",
      "Note the IP address currently in use",
      "Scan for IP conflicts on the network",
      "Change the IP address to an available range",
      "Restart the set-top box with the new IP",
      "Reinstall the widget solution if needed",
      "Reload IGCMP service",
      "Test the channel connection after the change",
    ],
    troubleshooting: [
      "Use an IP scanner to detect conflicts",
      "Document the IP change for reference",
      "Monitor connection stability after the change",
    ],
    hasImage: true,
    slug: "connection-failure",
    images: [
      "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23fff8e1'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23f57f17' font-size='16'%3EIP Configuration%3C/text%3E%3C/svg%3E",
      "/placeholder/cat-7.jpeg",
    ],
    visualGuideImages: [
      "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23fff8e1'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23f57f17' font-size='16'%3EIP Configuration%3C/text%3E%3C/svg%3E",
    ],
    quickInfoImages: ["/placeholder/cat-7.jpeg"],
  },
  {
    id: 8,
    category: "Kategori-8",
    device: "Chromecast",
    issue: "Reset Configuration",
    solutions: [
      "Restart Chromecast",
      "Reset Chromecast: bring it to the server room and hold the power button for 10 seconds",
    ],
    detailedSteps: [
      "Identify the issue that requires a reset",
      "Try a simple restart first",
      "Unplug the Chromecast power adapter for 10 seconds",
      "Plug the power adapter back in",
      "Wait for the Chromecast to boot up (the LED will change)",
      "If the issue persists, perform a factory reset",
      "Bring the Chromecast to the server room",
      "Press and hold the reset button for 10 seconds",
      "The LED will blink to indicate the reset process",
      "Set up the Chromecast again from scratch",
    ],
    troubleshooting: [
      "Back up important settings before a factory reset",
      "Prepare the WiFi credentials for re-setup",
      "Test basic functions after the reset",
    ],
    hasImage: true,
    slug: "reset-configuration",
    images: [
      "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23ffebee'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23c62828' font-size='16'%3EChromecast Reset Button%3C/text%3E%3C/svg%3E",
      "/placeholder/cat-8.jpeg",
    ],
    visualGuideImages: [
      "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23ffebee'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23c62828' font-size='16'%3EChromecast Reset Button%3C/text%3E%3C/svg%3E",
    ],
    quickInfoImages: ["/placeholder/cat-8.jpeg"],
  },
  {
    id: 9,
    category: "Kategori-9",
    device: "IPTV",
    issue: "No Device Logged",
    solutions: [
      "Make sure Allow Local Network is enabled in the iPhone settings",
      "Check VPN and Cast settings",
    ],
    detailedSteps: [
      "Open Settings on the iPhone",
      "Scroll down and select Privacy & Security",
      "Tap Local Network",
      "Find apps that need network access (Google Home, etc.)",
      "Enable the toggle for that app",
      "Check whether a VPN is active on the iPhone",
      "If a VPN is active, turn it off temporarily during setup",
      "Restart the app used for casting",
      "Try detecting the device again",
    ],
    troubleshooting: [
      "If it's still not detected, restart the iPhone",
      "Make sure the target device and iPhone are on the same WiFi network",
      "Try to forget and reconnect to the WiFi",
    ],
    hasImage: true,
    slug: "no-device-logged",
    images: [
      "/placeholder/900.jpeg",
      "/placeholder/901.jpeg",
      "/placeholder/cat-9.jpeg",
    ],
    visualGuideImages: ["/placeholder/900.jpeg", "/placeholder/901.jpeg"],
    quickInfoImages: ["/placeholder/cat-9.jpeg"],
  },
  {
    id: 10,
    category: "Kategori-10",
    device: "Chromecast",
    issue: "Chromecast Black Screen",
    solutions: ["Chromecast power adapter broken", "Check the Chromecast adapter"],
    detailedSteps: [
      "Check the LED indicator on the Chromecast",
      "If the LED is off, check the power adapter",
      "Try a different power adapter (5V 1A minimum)",
      "Make sure the micro USB cable is not damaged",
      "Check the HDMI connection to the TV",
      "Try a different HDMI port on the TV",
      "Restart the TV and change the input source to the HDMI in use",
      "If it's still a black screen, try resetting the Chromecast",
    ],
    troubleshooting: [
      "If the LED is blinking, it's likely a WiFi connection issue",
      "If the LED is solid but the screen is black, check the HDMI connection",
      "Try the Chromecast on another TV to isolate the issue",
    ],
    hasImage: true,
    slug: "chromecast-black-screen",
    images: ["/placeholder/1000.jpeg", "/placeholder/cat-10.jpeg"],
    visualGuideImages: ["/placeholder/1000.jpeg"],
    quickInfoImages: ["/placeholder/cat-10.jpeg"],
  },
  {
    id: 11,
    category: "Kategori-11",
    device: "Channel",
    issue: "Channel Not Found",
    solutions: ["LAN Out connected instead of LAN In"],
    detailedSteps: [
      "Check the back of the set-top box or TV",
      "Find the port labeled 'LAN IN' or 'ETHERNET IN'",
      "Make sure the LAN cable is plugged into the IN port, not OUT",
      "The OUT port is usually used to daisy-chain to other devices",
      "Disconnect the cable from the OUT port if plugged in wrong",
      "Connect the cable to the LAN IN port correctly",
      "Wait a moment until the connection is established",
      "Restart the channel app or reboot the set-top box",
    ],
    troubleshooting: [
      "If there are still no channels, check the IPTV configuration",
      "Make sure the channel subscription is still active",
      "Contact technical support to verify the channel list",
    ],
    hasImage: true,
    slug: "channel-not-found",
    images: [
      "/placeholder/23110.jpeg",
      "/placeholder/23111.jpeg",
      "/placeholder/cat-11.jpeg",
    ],
    visualGuideImages: ["/placeholder/23110.jpeg", "/placeholder/23111.jpeg"],
    quickInfoImages: ["/placeholder/cat-11.jpeg"],
  },
  {
    id: 12,
    category: "Kategori-12",
    device: "Chromecast",
    issue: "Network Connection Failed",
    solutions: [
      "Check WiFi connection strength",
      "Restart Chromecast device",
      "Verify router settings",
      "Check for IP conflicts",
    ],
    detailedSteps: [
      "Check WiFi signal strength on Chromecast",
      "Move Chromecast closer to router if signal weak",
      "Restart Chromecast by unplugging for 10 seconds",
      "Verify router is broadcasting 2.4GHz WiFi (Chromecast prefers this)",
      "Check if MAC address filtering is enabled on router",
      "Verify Chromecast IP address in router admin panel",
      "Check for IP conflicts using router's device list",
      "Assign static IP to Chromecast if necessary",
      "Update router firmware if outdated",
      "Reset Chromecast to factory settings if problem persists",
    ],
    troubleshooting: [
      "Ensure WiFi network is not hidden",
      "Check if router supports multicast (required for Chromecast)",
      "Try different WiFi band (2.4GHz vs 5GHz)",
      "Verify firewall is not blocking Chromecast communication",
      "Check if other devices can connect to the same WiFi",
    ],
    hasImage: false,
    slug: "network-connection-failed",
    images: [],
    visualGuideImages: [],
    quickInfoImages: [],
  },
  {
    id: 13,
    category: "Kategori-13",
    device: "IPTV",
    issue: "System Initialization Error",
    solutions: [
      "Restart IPTV set-top box",
      "Check system firmware version",
      "Reinitialize system settings",
      "Contact technical support if persists",
    ],
    detailedSteps: [
      "Power off the IPTV set-top box completely",
      "Unplug the power cable from the wall outlet",
      "Wait for 30 seconds before plugging back in",
      "Press and hold the power button for 10 seconds",
      "Release the button and plug in the power cable",
      "Wait for the system to boot up completely",
      "Navigate to Settings > System > About",
      "Check current firmware version",
      "Compare with latest version from service provider",
      "If outdated, contact technical support for firmware update",
      "For reinitialization: Settings > System > Reset",
      "Select 'Factory Reset' option (this will erase all settings)",
      "Wait for reinitialization to complete",
      "Reconfigure network and subscription settings",
    ],
    troubleshooting: [
      "Check if HDMI cable is properly connected",
      "Try different HDMI port on TV",
      "Verify power adapter is working (check LED indicator)",
      "Ensure stable internet connection",
      "Check for error codes on TV screen",
      "Note any error messages for technical support",
      "Test with another known working IPTV box if available",
    ],
    hasImage: false,
    slug: "system-initialization-error",
    images: [],
    visualGuideImages: [],
    quickInfoImages: [],
  },
  {
    id: 14,
    category: "Kategori-14",
    device: "Chromecast",
    issue: "No Device Found Chromecast: Logined",
    solutions: [
      "Verify user authentication status",
      "Check device registration",
      "Re-login to Google account",
      "Clear cast cache and retry",
    ],
    detailedSteps: [
      "Open Google Home app on your mobile device",
      "Check if you're logged in with correct Google account",
      "Verify account has proper permissions for casting",
      "Tap on device icon in Google Home app",
      "Check device settings and registration status",
      "If device appears as 'Offline', restart Chromecast",
      "Sign out from Google Home app",
      "Clear app cache: Settings > Apps > Google Home > Storage > Clear Cache",
      "Force stop the app and reopen",
      "Sign in again with your Google account",
      "Ensure Chromecast and mobile device are on same WiFi network",
      "Try casting from a different app (YouTube, Netflix)",
      "Restart both mobile device and Chromecast",
      "Uninstall and reinstall Google Home app if necessary",
      "Check for Google Home app updates in app store",
    ],
    troubleshooting: [
      "Verify WiFi connection is stable on both devices",
      "Check if VPN is enabled (disable if using)",
      "Ensure location services are enabled for Google Home app",
      "Try forgetting WiFi and reconnecting on both devices",
      "Check if firewall is blocking Chromecast discovery",
      "Verify router's AP isolation is disabled",
      "Try using guest network instead of main network",
      "Check if other devices can discover the Chromecast",
    ],
    hasImage: false,
    slug: "no-device-found-logined",
    images: [],
    visualGuideImages: [],
    quickInfoImages: [],
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

// Image Modal Component
const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  onImageClick,
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  const handleImageLoad = () => {
    setIsImageLoaded(true);
    setImageLoadError(false);
  };

  const handleImageError = () => {
    setImageLoadError(true);
    setIsImageLoaded(true);
  };

  useEffect(() => {
    setIsImageLoaded(false);
    setImageLoadError(false);
  }, [currentIndex]);

  if (!isOpen) return null;

  const hasMultipleImages = images.length > 1;
  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        aria-label="Close modal"
      >
        <X className="w-6 h-6 text-gray-800" />
      </button>

      {/* Image counter */}
      {hasMultipleImages && (
        <div className="absolute top-4 left-4 z-10 bg-black/60 text-white px-3 py-2 rounded-full text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Navigation buttons */}
      {hasMultipleImages && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>

          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6 text-gray-800" />
          </button>
        </>
      )}

      {/* Main image container */}
      <div
        className="flex items-center justify-center min-h-screen p-4 md:p-8"
        onClick={onClose}
      >
        <div
          className="relative max-w-full max-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          )}

          <Image
            src={currentImage}
            alt={`Guide step ${currentIndex + 1}`}
            width={400}
            height={300}
            className={`max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${isImageLoaded ? "opacity-100" : "opacity-0"
              } ${imageLoadError ? "hidden" : ""}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {imageLoadError && (
            <div className="bg-gray-100 rounded-lg p-8 flex flex-col items-center justify-center min-w-[300px] min-h-[200px]">
              <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 text-center">
                Failed to load image
                <br />
                <span className="text-sm">Step {currentIndex + 1}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail navigation for multiple images */}
      {hasMultipleImages && images.length > 2 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex space-x-2 bg-black/60 rounded-full px-4 py-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => onImageClick(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${index === currentIndex
                    ? "bg-white scale-125"
                    : "bg-white/50 hover:bg-white/75"
                  }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Modern Step Item Component
const ModernStepItem: React.FC<ModernStepItemProps> = ({
  step,
  index,
  completedSteps,
  toggleStepCompletion,
}) => {
  const isCompleted = completedSteps.includes(index);

  return (
    <div
      className={`group relative flex items-start space-x-4 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${isCompleted
          ? "bg-green-50 border-green-200 shadow-sm"
          : "bg-gray-50 border-gray-200 hover:border-blue-200 hover:bg-blue-50"
        }`}
      onClick={() => toggleStepCompletion(index)}
    >
      {/* Step Number / Checkbox */}
      <div className="flex-shrink-0 mt-1">
        {isCompleted ? (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center group-hover:border-blue-400">
            <span className="text-xs font-bold text-gray-600">{index + 1}</span>
          </div>
        )}
      </div>

      {/* Step Content */}
      <div className="flex-1">
        <p
          className={`text-sm font-medium leading-relaxed transition-colors ${isCompleted
              ? "text-green-800 line-through"
              : "text-gray-800 group-hover:text-blue-800"
            }`}
        >
          {step}
        </p>
      </div>

      {/* Completion Indicator */}
      <div className="flex-shrink-0">
        {isCompleted ? (
          <div className="text-green-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        ) : (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
};

// Modern Header Component
const ModernHeader: React.FC<ModernHeaderProps> = ({ router, article }) => (
  <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <div className="p-2 rounded-lg group-hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-medium">Back to Help Center</span>
        </button>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Article #{article.id}</span>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <span>{article.category}</span>
        </div>
      </div>
    </div>
  </header>
);

// Modern Article Header Component
const ModernArticleHeader: React.FC<ModernArticleHeaderProps> = ({
  article,
  deviceInfo,
  DeviceIcon,
  completionPercentage,
  totalSteps,
  completedSteps,
  resetProgress,
}) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-xl shadow-gray-900/5">
    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
      {/* Article Info */}
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`p-3 ${deviceInfo?.color || "bg-gray-500"} rounded-xl`}
          >
            <DeviceIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {article.issue}
            </h1>
            <p className="text-gray-600">Device: {article.device}</p>
          </div>
        </div>

        {/* Quick Solutions */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Quick Solutions:
          </h3>
          <div className="flex flex-wrap gap-2">
            {article.solutions.map((solution: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
              >
                {solution}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="lg:w-80">
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">
              Progress
            </span>
            <span className="text-sm text-gray-600">
              {completedSteps.length}/{totalSteps} steps
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900">
              {completionPercentage}%
            </span>
            {completedSteps.length > 0 && (
              <button
                onClick={resetProgress}
                className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Modern Visual Guide Component
const ModernVisualGuide: React.FC<ModernVisualGuideProps> = ({
  article,
  openImageModal,
}) => {
  const imagesToShow = article.visualGuideImages || article.images || [];

  if (!article.hasImage || !imagesToShow.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xl shadow-gray-900/5">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
          <ImageIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Visual Guide</h3>
          <p className="text-sm text-gray-500">Step-by-step screenshots</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {imagesToShow.map((imageSrc: string, index: number) => (
          <div key={index} className="relative group">
            <div
              className="relative cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-200 group-hover:border-blue-300 transition-all duration-300 aspect-video"
              onClick={() => openImageModal(index)}
            >
              <Image
                src={imageSrc}
                alt={`Guide step ${index + 1}`}
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                width={400}
                height={300}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='45%25' text-anchor='middle' dy='.3em' fill='%236b7280' font-size='14' font-weight='600'%3EScreenshot Guide%3C/text%3E%3Ctext x='50%25' y='60%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='12'%3EStep ${index + 1
                    }%3C/text%3E%3C/svg%3E`;
                }}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/95 backdrop-blur-sm rounded-full p-3 transform scale-75 group-hover:scale-100">
                  <ZoomIn className="w-5 h-5 text-gray-800" />
                </div>
              </div>

              {/* Step indicator */}
              <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs px-3 py-1 rounded-lg font-bold shadow-lg">
                Step {index + 1}
              </div>

              {/* Hover hint */}
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/70 text-white text-xs px-2 py-1 rounded-lg">
                Click to enlarge
              </div>
            </div>

            {/* Step description */}
            <div className="mt-3 text-sm text-gray-600 font-medium">
              Guide for step {index + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Modern Quick Info Component
const ModernQuickInfo: React.FC<ModernQuickInfoProps> = ({
  article,
  openImageModal,
}) => {
  const imagesToShow = article.quickInfoImages || [];

  if (!article.hasImage || !article.images?.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xl shadow-gray-900/5">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl">
          <Info className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Quick Information</h3>
          <p className="text-sm text-gray-500">Article details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {imagesToShow.map((imageSrc: string, index: number) => (
          <div key={index} className="relative group">
            <div
              className="relative cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 group-hover:border-blue-300 transition-all duration-300 aspect-video"
              onClick={() => {
                const mainImageIndex =
                  article.images?.findIndex((img) => img === imageSrc) || 0;
                openImageModal(mainImageIndex);
              }}
            >
              <Image
                src={imageSrc}
                alt={`Quick info ${index + 1}`}
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                width={400}
                height={300}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='45%25' text-anchor='middle' dy='.3em' fill='%236b7280' font-size='14' font-weight='600'%3EQuick Info%3C/text%3E%3Ctext x='50%25' y='60%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='12'%3EInfo ${index + 1
                    }%3C/text%3E%3C/svg%3E`;
                }}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/95 backdrop-blur-sm rounded-full p-3 transform scale-75 group-hover:scale-100">
                  <ZoomIn className="w-5 h-5 text-gray-800" />
                </div>
              </div>

              {/* Hover hint */}
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/70 text-white text-xs px-2 py-1 rounded-lg">
                Click to enlarge
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Modern Troubleshooting Section
const ModernTroubleshooting: React.FC<ModernTroubleshootingProps> = ({
  article,
}) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xl shadow-gray-900/5">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
        <AlertCircle className="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900">Additional Help</h3>
        <p className="text-sm text-gray-500">If steps don`&apos`t work</p>
      </div>
    </div>

    <div className="space-y-3">
      {article.troubleshooting.map((tip: string, index: number) => (
        <div
          key={index}
          className="group relative flex items-start space-x-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 hover:border-orange-300 transition-all duration-200"
        >
          <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mt-0.5">
            <AlertCircle className="w-3 h-3 text-white" />
          </div>
          <p className="text-sm text-orange-900 font-medium leading-relaxed">
            {tip}
          </p>
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Modern Back to Help Section
const ModernBackToHelp: React.FC = () => (
  <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200 p-6 shadow-xl shadow-blue-900/5 overflow-hidden">
    {/* Background decoration */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full transform translate-x-16 -translate-y-16"></div>

    <div className="relative">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
          <HelpCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-blue-900">Need More Help?</h3>
          <p className="text-sm text-blue-700">Explore other solutions</p>
        </div>
      </div>

      <p className="text-sm text-blue-800 mb-6 leading-relaxed">
        Browse our comprehensive knowledge base for more technical solutions and
        troubleshooting guides.
      </p>

      <Link
        href="/help"
        className="group w-full block text-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
      >
        <div className="flex items-center justify-center gap-2">
          <span>Browse All Articles</span>
          <ChevronDown className="w-4 h-4 rotate-[-90deg] group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </div>
  </div>
);

// Modern Step-by-Step Guide Section
const ModernStepGuide: React.FC<ModernStepGuideProps> = ({
  article,
  completedSteps,
  toggleStepCompletion,
}) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xl shadow-gray-900/5">
    <div className="flex items-center gap-3 mb-8">
      <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
        <Settings className="w-5 h-5 text-white" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Step-by-Step Guide</h2>
        <p className="text-sm text-gray-500">
          Follow these instructions carefully
        </p>
      </div>
    </div>

    <div className="space-y-4">
      {article.detailedSteps.map((step: string, index: number) => (
        <ModernStepItem
          key={index}
          step={step}
          index={index}
          completedSteps={completedSteps}
          toggleStepCompletion={toggleStepCompletion}
        />
      ))}
    </div>
  </div>
);

const HelpDetails: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const [article, setArticle] = useState<FAQ | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    currentIndex: 0,
  });

  useEffect(() => {
    const slug = params?.slug as string;

    if (slug) {
      const foundArticle = faqData.find((item) => item.slug === slug);
      if (foundArticle) {
        setArticle(foundArticle);
      }
    }
    setLoading(false);
  }, [params]);

  // Keyboard navigation for modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!imageModal.isOpen || !article?.images) return;

      switch (e.key) {
        case "Escape":
          setImageModal({ isOpen: false, currentIndex: 0 });
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (article.images.length > 1) {
            setImageModal((prev) => ({
              ...prev,
              currentIndex:
                prev.currentIndex > 0
                  ? prev.currentIndex - 1
                  : article.images!.length - 1,
            }));
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (article.images.length > 1) {
            setImageModal((prev) => ({
              ...prev,
              currentIndex:
                prev.currentIndex < article.images!.length - 1
                  ? prev.currentIndex + 1
                  : 0,
            }));
          }
          break;
      }
    },
    [imageModal.isOpen, article?.images]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (imageModal.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [imageModal.isOpen]);

  const openImageModal = (index: number) => {
    setImageModal({ isOpen: true, currentIndex: index });
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, currentIndex: 0 });
  };

  const nextImage = () => {
    if (!article?.images) return;
    setImageModal((prev) => ({
      ...prev,
      currentIndex:
        prev.currentIndex < article.images!.length - 1
          ? prev.currentIndex + 1
          : 0,
    }));
  };

  const prevImage = () => {
    if (!article?.images) return;
    setImageModal((prev) => ({
      ...prev,
      currentIndex:
        prev.currentIndex > 0
          ? prev.currentIndex - 1
          : article.images!.length - 1,
    }));
  };

  const goToImage = (index: number) => {
    setImageModal((prev) => ({ ...prev, currentIndex: index }));
  };

  const toggleStepCompletion = (stepIndex: number): void => {
    setCompletedSteps((prev) =>
      prev.includes(stepIndex)
        ? prev.filter((index) => index !== stepIndex)
        : [...prev, stepIndex]
    );
  };

  const resetProgress = (): void => {
    setCompletedSteps([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Artikel tidak ditemukan
          </h2>
          <p className="text-gray-600 mb-4">
            Artikel yang Anda cari tidak tersedia.
          </p>
          <Link
            href="/help"
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
          >
            Kembali ke Bantuan
          </Link>
        </div>
      </div>
    );
  }

  const deviceInfo: DeviceConfig = deviceConfig[article.device] || {
    icon: HelpCircle,
    color: "bg-gray-500",
    bgLight: "bg-gray-50",
    textColor: "text-gray-700",
  };
  const DeviceIcon: LucideIcon = deviceInfo?.icon || HelpCircle;
  const totalSteps = article.detailedSteps.length;
  const completionPercentage = Math.round(
    (completedSteps.length / totalSteps) * 100
  );

  const headerProps: ModernHeaderProps = {
    router,
    article,
  };

  const articleHeaderProps: ModernArticleHeaderProps = {
    article,
    deviceInfo,
    DeviceIcon,
    completionPercentage,
    totalSteps,
    completedSteps,
    resetProgress,
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <ModernHeader {...headerProps} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ModernArticleHeader {...articleHeaderProps} />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="xl:col-span-2 space-y-8">
              <ModernStepGuide
                article={article}
                completedSteps={completedSteps}
                toggleStepCompletion={toggleStepCompletion}
              />

              <ModernTroubleshooting article={article} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <ModernQuickInfo
                article={article}
                openImageModal={openImageModal}
              />

              <ModernVisualGuide
                article={article}
                openImageModal={openImageModal}
              />

              <ModernBackToHelp />
            </div>
          </div>
        </main>

        {/* Modern Footer */}
        <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="text-center">
              <p className="text-gray-500 text-xs">
                © 2025 Radisson Blu Uluwatu. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Image Modal */}
      {article.images && (
        <ImageModal
          isOpen={imageModal.isOpen}
          images={article.images}
          currentIndex={imageModal.currentIndex}
          onClose={closeImageModal}
          onNext={nextImage}
          onPrev={prevImage}
          onImageClick={goToImage}
        />
      )}

      {/* Custom Styles */}
      <style jsx global>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideIn {
          animation: slideInFromBottom 0.6s ease-out forwards;
        }

        .animate-slideIn:nth-child(1) {
          animation-delay: 0.1s;
        }
        .animate-slideIn:nth-child(2) {
          animation-delay: 0.2s;
        }
        .animate-slideIn:nth-child(3) {
          animation-delay: 0.3s;
        }
        .animate-slideIn:nth-child(4) {
          animation-delay: 0.4s;
        }

        .glass-effect {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .shadow-glow-blue {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.15);
        }

        .shadow-glow-green {
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.15);
        }

        .text-shadow {
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </>
  );
};

export default HelpDetails;
