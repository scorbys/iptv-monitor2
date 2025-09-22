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
    detailedSteps: [
      "Buka aplikasi Google Home di perangkat iOS Anda",
      "Pastikan Chromecast dan perangkat iOS terhubung ke jaringan WiFi yang sama",
      "Di pengaturan iPhone, buka Settings > Privacy & Security > Local Network",
      "Aktifkan akses Local Network untuk aplikasi Google Home",
      "Logout dari WiFi Radisson Guest, lalu login kembali dengan kredensial yang benar",
      "Restart Chromecast dengan mencabut dan memasang kembali adaptor daya",
      "Buka browser dan akses log-out.me untuk memastikan tidak ada session yang konflik",
      "Coba setup Chromecast kembali melalui aplikasi Google Home",
    ],
    troubleshooting: [
      "Jika masih tidak terdeteksi, coba reset Chromecast ke pengaturan pabrik",
      "Pastikan tidak ada VPN yang aktif di perangkat iOS",
      "Periksa apakah firewall hotel memblokir koneksi Chromecast",
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
      "Periksa koneksi LAN pada TV",
      "Pastikan sumber HDMI diatur ke HDMI-1",
      "Restart perangkat IPTV",
      "Periksa indikator LED pada box IPTV",
    ],
    detailedSteps: [
      "Periksa apakah kabel LAN terpasang dengan kuat ke port yang benar",
      "Pastikan kabel LAN terhubung ke port 'LAN IN' bukan 'LAN OUT'",
      "Pada remote TV, tekan tombol 'Source' atau 'Input'",
      "Pilih HDMI-1 sebagai sumber input",
      "Cabut adaptor daya box IPTV selama 10 detik, lalu pasang kembali",
      "Tunggu hingga indikator LED berubah menjadi hijau (sekitar 2-3 menit)",
      "Jika LED masih merah atau berkedip, periksa koneksi internet",
      "Test koneksi dengan mengganti kabel LAN jika tersedia",
    ],
    troubleshooting: [
      "Jika masih lemah, periksa kabel LAN apakah ada kerusakan fisik",
      "Pastikan tidak ada bending yang berlebihan pada kabel",
      "Coba gunakan port LAN yang berbeda jika tersedia di wall outlet",
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
      "Periksa koneksi LAN (pastikan terpasang di LAN IN)",
      "Posisikan kabel LAN dengan benar",
      "Pastikan tidak terpasang di LAN OUT",
      "Test koneksi dengan kabel LAN lain",
    ],
    detailedSteps: [
      "Matikan TV dan box IPTV terlebih dahulu",
      "Lepaskan kabel LAN dari box IPTV",
      "Periksa port pada box IPTV, cari tulisan 'LAN IN' atau 'ETHERNET IN'",
      "Pastikan kabel LAN dipasang ke port 'LAN IN', bukan 'LAN OUT'",
      "Tekan kabel hingga terdengar bunyi 'click' yang menandakan terpasang kuat",
      "Periksa ujung kabel yang terhubung ke wall outlet juga terpasang dengan kuat",
      "Nyalakan kembali box IPTV dan tunggu proses booting selesai",
      "Nyalakan TV dan atur input ke HDMI-1",
      "Jika masih bermasalah, coba gunakan kabel LAN cadangan",
    ],
    troubleshooting: [
      "Periksa apakah ada kerusakan pada konektor RJ45",
      "Pastikan tidak ada dust atau kotoran di dalam port",
      "Jika tersedia, test dengan kabel LAN yang berbeda",
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
      "Pastikan perangkat dalam satu jaringan WiFi",
      "Allow local network access pada iPhone",
      "Follow setup wizard di aplikasi",
    ],
    detailedSteps: [
      "Download dan install aplikasi Google Home dari App Store",
      "Pastikan Chromecast terhubung ke TV via HDMI dan mendapat daya",
      "Buka Settings di iPhone > Privacy & Security > Local Network",
      "Aktifkan toggle untuk aplikasi Google Home",
      "Buka aplikasi Google Home dan sign in dengan akun Google",
      "Tap tombol '+' untuk menambah perangkat baru",
      "Pilih 'Set up device' > 'New devices'",
      "Pilih rumah/lokasi tempat Chromecast akan disetup",
      "Aplikasi akan mencari Chromecast di sekitar",
      "Ikuti instruksi on-screen untuk menyelesaikan setup",
      "Sambungkan Chromecast ke WiFi 'Radisson Guest'",
      "Masukkan password WiFi jika diminta",
    ],
    troubleshooting: [
      "Jika Chromecast tidak terdeteksi, restart aplikasi Google Home",
      "Pastikan iPhone dan Chromecast terhubung ke WiFi yang sama",
      "Jika setup gagal, reset Chromecast dengan menekan tombol di device selama 25 detik",
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
      "Buka aplikasi VLC Media Player",
      "Pilih menu 'Media' > 'Open Network Stream'",
      "Masukkan URL channel yang bermasalah",
      "Klik 'Play' untuk test streaming",
      "Jika VLC bisa memutar, masalah ada di aplikasi IPTV",
      "Jika VLC tidak bisa, masalah ada di provider (Biznet)",
      "Hubungi technical support untuk konfirmasi channel",
      "Laporkan hasil test VLC ke tim support",
    ],
    troubleshooting: [
      "Coba channel lain untuk memastikan tidak ada masalah jaringan",
      "Periksa kecepatan internet dengan speed test",
      "Restart modem/router jika diperlukan",
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
      "Identifikasi jenis error yang muncul",
      "Periksa konfigurasi HBrowser di set-top box",
      "Buka menu pengaturan aplikasi IPTV",
      "Cari pengaturan 'Widget' atau 'Player Settings'",
      "Reset konfigurasi widget ke default",
      "Restart aplikasi IPTV setelah perubahan",
      "Test channel yang bermasalah",
      "Jika masih error, lakukan test dengan VLC seperti prosedur sebelumnya",
    ],
    troubleshooting: [
      "Backup konfigurasi sebelum melakukan reset",
      "Catat pengaturan yang berhasil untuk referensi",
      "Hubungi support jika error persisten setelah reset",
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
      "Identifikasi penyebab connection failure",
      "Periksa status koneksi internet",
      "Buka pengaturan jaringan di set-top box",
      "Catat IP address yang sedang digunakan",
      "Scan untuk IP conflict di jaringan",
      "Ubah IP address ke range yang available",
      "Restart set-top box dengan IP baru",
      "Reinstall widget solution jika diperlukan",
      "Reload IGCMP service",
      "Test koneksi channel setelah perubahan",
    ],
    troubleshooting: [
      "Gunakan IP scanner untuk detect conflict",
      "Dokumentasikan perubahan IP untuk referensi",
      "Monitor stabilitas koneksi setelah perubahan",
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
      "Reset Chromecast dibawa ke ruang server pencet tombol power 10 Detik",
    ],
    detailedSteps: [
      "Identifikasi masalah yang memerlukan reset",
      "Coba restart sederhana terlebih dahulu",
      "Cabut adaptor daya Chromecast selama 10 detik",
      "Pasang kembali adaptor daya",
      "Tunggu Chromecast boot up (LED akan berubah)",
      "Jika masalah persisten, lakukan factory reset",
      "Bawa Chromecast ke ruang server",
      "Tekan dan tahan tombol reset selama 10 detik",
      "LED akan berkedip menandakan proses reset",
      "Setup ulang Chromecast dari awal",
    ],
    troubleshooting: [
      "Backup pengaturan penting sebelum factory reset",
      "Siapkan kredensial WiFi untuk setup ulang",
      "Test fungsi basic setelah reset",
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
      "Pastikan Allow local Network pada Setingan iPhone",
      "Check VPN and Cast settings",
    ],
    detailedSteps: [
      "Buka Settings di iPhone",
      "Scroll ke bawah dan pilih Privacy & Security",
      "Tap Local Network",
      "Cari aplikasi yang memerlukan akses network (Google Home, dll)",
      "Aktifkan toggle untuk aplikasi tersebut",
      "Periksa apakah VPN sedang aktif di iPhone",
      "Jika VPN aktif, matikan sementara selama setup",
      "Restart aplikasi yang digunakan untuk casting",
      "Coba deteksi perangkat kembali",
    ],
    troubleshooting: [
      "Jika masih tidak terdeteksi, restart iPhone",
      "Pastikan perangkat target dan iPhone dalam jaringan WiFi yang sama",
      "Coba forget dan reconnect ke WiFi",
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
    solutions: ["Chromecast Power Adaptor Rusak", "Check Adaptor Chromecast"],
    detailedSteps: [
      "Periksa LED indicator pada Chromecast",
      "Jika LED tidak menyala, periksa adaptor daya",
      "Coba gunakan adaptor daya yang berbeda (5V 1A minimum)",
      "Pastikan kabel micro USB tidak rusak",
      "Periksa koneksi HDMI ke TV",
      "Coba port HDMI yang berbeda di TV",
      "Restart TV dan ubah input source ke HDMI yang digunakan",
      "Jika masih black screen, coba reset Chromecast",
    ],
    troubleshooting: [
      "Jika LED berkedip, kemungkinan masalah koneksi WiFi",
      "Jika LED solid tapi layar hitam, periksa HDMI connection",
      "Coba Chromecast di TV lain untuk isolasi masalah",
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
    solutions: ["LAN Out Terpasang bukan LAN In"],
    detailedSteps: [
      "Periksa bagian belakang set-top box atau TV",
      "Cari port yang berlabel 'LAN IN' atau 'ETHERNET IN'",
      "Pastikan kabel LAN terpasang di port IN, bukan OUT",
      "Port OUT biasanya digunakan untuk daisy-chain ke device lain",
      "Lepaskan kabel dari port OUT jika salah pasang",
      "Pasang kabel ke port LAN IN dengan benar",
      "Tunggu beberapa saat hingga koneksi tersambung",
      "Restart aplikasi channel atau reboot set-top box",
    ],
    troubleshooting: [
      "Jika masih tidak ada channel, periksa konfigurasi IPTV",
      "Pastikan subscription channel masih aktif",
      "Hubungi technical support untuk verifikasi channel list",
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
        className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        aria-label="Close modal"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
      </button>

      {/* Image counter */}
      {hasMultipleImages && (
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 bg-black/60 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Navigation buttons */}
      {hasMultipleImages && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
          </button>

          <button
            onClick={onNext}
            className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
          </button>
        </>
      )}

      {/* Main image container */}
      <div
        className="flex items-center justify-center min-h-screen p-2 sm:p-4 md:p-8"
        onClick={onClose}
      >
        <div
          className="relative max-w-full max-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          )}

          <Image
            src={currentImage}
            alt={`Guide step ${currentIndex + 1}`}
            width={400}
            height={300}
            className={`max-w-full max-h-[80vh] sm:max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
              isImageLoaded ? "opacity-100" : "opacity-0"
            } ${imageLoadError ? "hidden" : ""}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {imageLoadError && (
            <div className="bg-gray-100 rounded-lg p-4 sm:p-8 flex flex-col items-center justify-center min-w-[280px] sm:min-w-[300px] min-h-[200px]">
              <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mb-2 sm:mb-4" />
              <p className="text-gray-600 text-center text-sm sm:text-base">
                Failed to load image
                <br />
                <span className="text-xs sm:text-sm">
                  Step {currentIndex + 1}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail navigation - Hidden on mobile */}
      {hasMultipleImages && images.length > 2 && (
        <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 z-10 hidden sm:block">
          <div className="flex space-x-2 bg-black/60 rounded-full px-4 py-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => onImageClick(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
                  index === currentIndex
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

const ModernStepItem: React.FC<ModernStepItemProps> = ({
  step,
  index,
  completedSteps,
  toggleStepCompletion,
}) => {
  const isCompleted = completedSteps.includes(index);

  return (
    <div
      className={`group relative flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
        isCompleted
          ? "bg-green-50 border-green-200 shadow-sm"
          : "bg-gray-50 border-gray-200 hover:border-blue-200 hover:bg-blue-50"
      }`}
      onClick={() => toggleStepCompletion(index)}
    >
      {/* Step Number / Checkbox */}
      <div className="flex-shrink-0 mt-1">
        {isCompleted ? (
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
        ) : (
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center group-hover:border-blue-400">
            <span className="text-xs font-bold text-gray-600">{index + 1}</span>
          </div>
        )}
      </div>

      {/* Step Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium leading-relaxed transition-colors ${
            isCompleted
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
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        ) : (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
};

const ModernHeader: React.FC<ModernHeaderProps> = ({ router, article }) => (
  <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-14 sm:h-16">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <div className="p-1.5 sm:p-2 rounded-lg group-hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="font-medium text-sm sm:text-base">Back</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500">
          <span>#{article.id}</span>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <span className="truncate max-w-20 sm:max-w-none">
            {article.category}
          </span>
        </div>
      </div>
    </div>
  </header>
);

const ModernArticleHeader: React.FC<ModernArticleHeaderProps> = ({
  article,
  deviceInfo,
  DeviceIcon,
  completionPercentage,
  totalSteps,
  completedSteps,
  resetProgress,
}) => (
  <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8 shadow-xl shadow-gray-900/5">
    <div className="space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-6">
      {/* Article Info */}
      <div className="flex-1">
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`p-2 sm:p-3 ${
              deviceInfo?.color || "bg-gray-500"
            } rounded-xl flex-shrink-0`}
          >
            <DeviceIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">
              {article.issue}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Device: {article.device}
            </p>
          </div>
        </div>

        {/* Quick Solutions */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
            Quick Solutions:
          </h3>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {article.solutions.map((solution: string, index: number) => (
              <span
                key={index}
                className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm rounded-full font-medium break-words"
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
            <span className="text-xl sm:text-2xl font-bold text-gray-900">
              {completionPercentage}%
            </span>
            {completedSteps.length > 0 && (
              <button
                onClick={resetProgress}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ModernVisualGuide: React.FC<ModernVisualGuideProps> = ({
  article,
  openImageModal,
}) => {
  const imagesToShow = article.visualGuideImages || article.images || [];

  if (!article.hasImage || !imagesToShow.length) return null;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xl shadow-gray-900/5">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
          <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            Visual Guide
          </h3>
          <p className="text-xs sm:text-sm text-gray-500">
            Step-by-step screenshots
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {imagesToShow.map((imageSrc: string, index: number) => (
          <div key={index} className="relative group">
            <div
              className="relative cursor-pointer overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-200 group-hover:border-blue-300 transition-all duration-300 aspect-video"
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
                  target.src = `data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='45%25' text-anchor='middle' dy='.3em' fill='%236b7280' font-size='14' font-weight='600'%3EScreenshot Guide%3C/text%3E%3Ctext x='50%25' y='60%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='12'%3EStep ${
                    index + 1
                  }%3C/text%3E%3C/svg%3E`;
                }}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/95 backdrop-blur-sm rounded-full p-2 sm:p-3 transform scale-75 group-hover:scale-100">
                  <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800" />
                </div>
              </div>

              {/* Step indicator */}
              <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-blue-600 text-white text-xs px-2 sm:px-3 py-1 rounded-lg font-bold shadow-lg">
                Step {index + 1}
              </div>

              {/* Hover hint - Hidden on mobile */}
              <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/70 text-white text-xs px-2 py-1 rounded-lg hidden sm:block">
                Click to enlarge
              </div>
            </div>

            {/* Step description */}
            <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 font-medium">
              Guide for step {index + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

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
                  target.src = `data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='45%25' text-anchor='middle' dy='.3em' fill='%236b7280' font-size='14' font-weight='600'%3EQuick Info%3C/text%3E%3Ctext x='50%25' y='60%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='12'%3EInfo ${
                    index + 1
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
    console.log("Article slug from URL:", slug);

    if (slug) {
      const foundArticle = faqData.find((item) => item.slug === slug);
      console.log("Found article:", foundArticle);
      if (foundArticle) {
        setArticle(foundArticle);
      }
    }
    setLoading(false);
  }, [params]);

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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <ModernArticleHeader {...articleHeaderProps} />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
            {/* Main Content */}
            <div className="xl:col-span-2 space-y-6 sm:space-y-8">
              <ModernStepGuide
                article={article}
                completedSteps={completedSteps}
                toggleStepCompletion={toggleStepCompletion}
              />

              <ModernTroubleshooting article={article} />
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6">
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
