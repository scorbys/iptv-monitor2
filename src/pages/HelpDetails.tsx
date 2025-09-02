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
  Clock,
  BarChart3,
  AlertCircle,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
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
  actionType: string;
  priority: string;
  estimatedTime: string;
  difficulty: string;
  slug: string;
  images?: string[];
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

// Enhanced mock data with more articles
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
      "Coba setup Chromecast kembali melalui aplikasi Google Home"
    ],
    troubleshooting: [
      "Jika masih tidak terdeteksi, coba reset Chromecast ke pengaturan pabrik",
      "Pastikan tidak ada VPN yang aktif di perangkat iOS",
      "Periksa apakah firewall hotel memblokir koneksi Chromecast"
    ],
    hasImage: true,
    actionType: "System",
    priority: "High",
    estimatedTime: "10-15 minutes",
    difficulty: "Medium",
    slug: "no-device-found-chromecast",
    images: ["/placeholder/100.jpeg", "/placeholder/101.jpeg"]
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
      "Test koneksi dengan mengganti kabel LAN jika tersedia"
    ],
    troubleshooting: [
      "Jika masih lemah, periksa kabel LAN apakah ada kerusakan fisik",
      "Pastikan tidak ada bending yang berlebihan pada kabel",
      "Coba gunakan port LAN yang berbeda jika tersedia di wall outlet"
    ],
    hasImage: true,
    actionType: "On Site",
    priority: "Medium",
    estimatedTime: "5-10 minutes",
    difficulty: "Easy",
    slug: "weak-or-no-signal",
    images: ["/placeholder/23110.jpeg", "/placeholder/23111.jpeg"]
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
      "Jika masih bermasalah, coba gunakan kabel LAN cadangan"
    ],
    troubleshooting: [
      "Periksa apakah ada kerusakan pada konektor RJ45",
      "Pastikan tidak ada dust atau kotoran di dalam port",
      "Jika tersedia, test dengan kabel LAN yang berbeda"
    ],
    hasImage: true,
    actionType: "On Site",
    priority: "High",
    estimatedTime: "5-8 minutes",
    difficulty: "Easy",
    slug: "unplug-lan-tv",
    images: ["/placeholder/23110.jpeg", "/placeholder/23111.jpeg"]
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
      "Masukkan password WiFi jika diminta"
    ],
    troubleshooting: [
      "Jika Chromecast tidak terdeteksi, restart aplikasi Google Home",
      "Pastikan iPhone dan Chromecast terhubung ke WiFi yang sama",
      "Jika setup gagal, reset Chromecast dengan menekan tombol di device selama 25 detik"
    ],
    hasImage: true,
    actionType: "System",
    priority: "Medium",
    estimatedTime: "8-12 minutes",
    difficulty: "Medium",
    slug: "chromecast-setup-ios",
    images: ["/placeholder/400.jpeg"]
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
      "Laporkan hasil test VLC ke tim support"
    ],
    troubleshooting: [
      "Coba channel lain untuk memastikan tidak ada masalah jaringan",
      "Periksa kecepatan internet dengan speed test",
      "Restart modem/router jika diperlukan"
    ],
    hasImage: true,
    actionType: "System",
    priority: "Medium",
    estimatedTime: "10-15 minutes",
    difficulty: "Medium",
    slug: "error-playing",
    images: [
      "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f3e5f5'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%237b1fa2' font-size='16'%3EVLC Testing Method%3C/text%3E%3C/svg%3E",
      "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23e8f5e8'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%232e7d32' font-size='16'%3ENetwork Stream Setup%3C/text%3E%3C/svg%3E"
    ]
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
      "Jika masih error, lakukan test dengan VLC seperti prosedur sebelumnya"
    ],
    troubleshooting: [
      "Backup konfigurasi sebelum melakukan reset",
      "Catat pengaturan yang berhasil untuk referensi",
      "Hubungi support jika error persisten setelah reset"
    ],
    hasImage: false,
    actionType: "System",
    priority: "High",
    estimatedTime: "15-20 minutes",
    difficulty: "Hard",
    slug: "error-player-error",
    images: []
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
      "Test koneksi channel setelah perubahan"
    ],
    troubleshooting: [
      "Gunakan IP scanner untuk detect conflict",
      "Dokumentasikan perubahan IP untuk referensi",
      "Monitor stabilitas koneksi setelah perubahan"
    ],
    hasImage: true,
    actionType: "System",
    priority: "Medium",
    estimatedTime: "20-30 minutes",
    difficulty: "Hard",
    slug: "connection-failure",
    images: [
      "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23fff8e1'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23f57f17' font-size='16'%3EIP Configuration%3C/text%3E%3C/svg%3E"
    ]
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
      "Setup ulang Chromecast dari awal"
    ],
    troubleshooting: [
      "Backup pengaturan penting sebelum factory reset",
      "Siapkan kredensial WiFi untuk setup ulang",
      "Test fungsi basic setelah reset"
    ],
    hasImage: true,
    actionType: "On Site",
    priority: "Low",
    estimatedTime: "10-15 minutes",
    difficulty: "Easy",
    slug: "reset-configuration",
    images: [
      "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23ffebee'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23c62828' font-size='16'%3EChromecast Reset Button%3C/text%3E%3C/svg%3E"
    ]
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
      "Coba deteksi perangkat kembali"
    ],
    troubleshooting: [
      "Jika masih tidak terdeteksi, restart iPhone",
      "Pastikan perangkat target dan iPhone dalam jaringan WiFi yang sama",
      "Coba forget dan reconnect ke WiFi"
    ],
    hasImage: true,
    actionType: "On Site",
    priority: "High",
    estimatedTime: "5-8 minutes",
    difficulty: "Easy",
    slug: "no-device-logged",
    images: ["/placeholder/900.jpeg", "/placeholder/901.jpeg"]
  },
  {
    id: 10,
    category: "Kategori-10",
    device: "Chromecast",
    issue: "Chromecast Black Screen",
    solutions: [
      "Chromecast Power Adaptor Rusak", 
      "Check Adaptor Chromecast"
    ],
    detailedSteps: [
      "Periksa LED indicator pada Chromecast",
      "Jika LED tidak menyala, periksa adaptor daya",
      "Coba gunakan adaptor daya yang berbeda (5V 1A minimum)",
      "Pastikan kabel micro USB tidak rusak",
      "Periksa koneksi HDMI ke TV",
      "Coba port HDMI yang berbeda di TV",
      "Restart TV dan ubah input source ke HDMI yang digunakan",
      "Jika masih black screen, coba reset Chromecast"
    ],
    troubleshooting: [
      "Jika LED berkedip, kemungkinan masalah koneksi WiFi",
      "Jika LED solid tapi layar hitam, periksa HDMI connection",
      "Coba Chromecast di TV lain untuk isolasi masalah"
    ],
    hasImage: true,
    actionType: "System",
    priority: "Medium",
    estimatedTime: "10-15 minutes",
    difficulty: "Medium",
    slug: "chromecast-black-screen",
    images: ["/placeholder/1000.jpeg"]
  },
  {
    id: 11,
    category: "Kategori-11",
    device: "Channel",
    issue: "Channel Not Found",
    solutions: [
      "LAN Out Terpasang bukan LAN In"
    ],
    detailedSteps: [
      "Periksa bagian belakang set-top box atau TV",
      "Cari port yang berlabel 'LAN IN' atau 'ETHERNET IN'",
      "Pastikan kabel LAN terpasang di port IN, bukan OUT",
      "Port OUT biasanya digunakan untuk daisy-chain ke device lain",
      "Lepaskan kabel dari port OUT jika salah pasang",
      "Pasang kabel ke port LAN IN dengan benar",
      "Tunggu beberapa saat hingga koneksi tersambung",
      "Restart aplikasi channel atau reboot set-top box"
    ],
    troubleshooting: [
      "Jika masih tidak ada channel, periksa konfigurasi IPTV",
      "Pastikan subscription channel masih aktif",
      "Hubungi technical support untuk verifikasi channel list"
    ],
    hasImage: true,
    actionType: "System",
    priority: "Low",
    estimatedTime: "3-5 minutes",
    difficulty: "Easy",
    slug: "channel-not-found",
    images: ["/placeholder/23110.jpeg", "/placeholder/23111.jpeg"]
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
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/20"
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
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/20"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>

          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/20"
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
          className="relative max-w-full max-h-full animate-zoomIn"
          onClick={(e) => e.stopPropagation()}
        >
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          )}
          
          <img
            src={currentImage}
            alt={`Guide step ${currentIndex + 1}`}
            className={`max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
              isImageLoaded ? 'opacity-100' : 'opacity-0'
            } ${imageLoadError ? 'hidden' : ''}`}
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
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? 'bg-white scale-125'
                    : 'bg-white/50 hover:bg-white/75'
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
    console.log('Article slug from URL:', slug);
    
    if (slug) {
      const foundArticle = faqData.find(item => item.slug === slug);
      console.log('Found article:', foundArticle);
      if (foundArticle) {
        setArticle(foundArticle);
      }
    }
    setLoading(false);
  }, [params]);

  // Keyboard navigation for modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!imageModal.isOpen || !article?.images) return;

    switch (e.key) {
      case 'Escape':
        setImageModal({ isOpen: false, currentIndex: 0 });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (article.images.length > 1) {
          setImageModal(prev => ({
            ...prev,
            currentIndex: prev.currentIndex > 0 ? prev.currentIndex - 1 : article.images!.length - 1
          }));
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (article.images.length > 1) {
          setImageModal(prev => ({
            ...prev,
            currentIndex: prev.currentIndex < article.images!.length - 1 ? prev.currentIndex + 1 : 0
          }));
        }
        break;
    }
  }, [imageModal.isOpen, article?.images]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (imageModal.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
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
    setImageModal(prev => ({
      ...prev,
      currentIndex: prev.currentIndex < article.images!.length - 1 ? prev.currentIndex + 1 : 0
    }));
  };

  const prevImage = () => {
    if (!article?.images) return;
    setImageModal(prev => ({
      ...prev,
      currentIndex: prev.currentIndex > 0 ? prev.currentIndex - 1 : article.images!.length - 1
    }));
  };

  const goToImage = (index: number) => {
    setImageModal(prev => ({ ...prev, currentIndex: index }));
  };

  const toggleStepCompletion = (stepIndex: number): void => {
    setCompletedSteps(prev => 
      prev.includes(stepIndex) 
        ? prev.filter(index => index !== stepIndex)
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Artikel tidak ditemukan</h2>
          <p className="text-gray-600 mb-4">Artikel yang Anda cari tidak tersedia.</p>
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

  const deviceInfo: DeviceConfig = deviceConfig[article.device];
  const DeviceIcon: LucideIcon = deviceInfo?.icon || HelpCircle;
  const totalSteps = article.detailedSteps.length;
  const completionPercentage = Math.round((completedSteps.length / totalSteps) * 100);

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <Link href="/dashboard">
                  <div className="relative cursor-pointer">
                    <Image
                      src="/logo-black.png"
                      alt="Logo"
                      width={240}
                      height={240}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                </Link>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Detail Bantuan</h1>
                  <p className="text-sm text-gray-500">{article.category}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {article.estimatedTime} • {article.difficulty}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Article Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
            <div className="flex items-start space-x-4 mb-6">
              <div className={`w-16 h-16 ${deviceInfo?.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <DeviceIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-semibold text-gray-600">{article.category}</span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      article.actionType === "System"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {article.actionType}
                  </span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      article.priority === "High"
                        ? "bg-red-100 text-red-600"
                        : article.priority === "Medium"
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {article.priority} Priority
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{article.issue}</h1>
                <p className="text-gray-600 flex items-center gap-4">
                  <span>Device: {article.device}</span>
                  <span>•</span>
                  <span>Estimated time: {article.estimatedTime}</span>
                  <span>•</span>
                  <span>Difficulty: {article.difficulty}</span>
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Progress Completion
                </span>
                <span className="text-sm font-semibold text-cyan-600">{completionPercentage}% ({completedSteps.length}/{totalSteps})</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={resetProgress}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Progress
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Detailed Steps */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step-by-step Guide */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-600" />
                  Detailed Step-by-Step Guide
                </h2>
                <div className="space-y-4">
                  {article.detailedSteps.map((step: string, index: number) => (
                    <div
                      key={index}
                      className={`flex items-start space-x-4 p-4 rounded-lg border-2 transition-all duration-200 ${
                        completedSteps.includes(index)
                          ? "bg-green-50 border-green-200"
                          : "bg-gray-50 border-gray-200 hover:border-cyan-200 hover:bg-cyan-50"
                      }`}
                    >
                      <button
                        onClick={() => toggleStepCompletion(index)}
                        className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          completedSteps.includes(index)
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 hover:border-cyan-400 hover:bg-cyan-50"
                        }`}
                      >
                        {completedSteps.includes(index) && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-900">
                            Step {index + 1}
                          </span>
                          {completedSteps.includes(index) && (
                            <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                              Completed
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-sm leading-relaxed ${
                            completedSteps.includes(index) ? "text-green-700" : "text-gray-700"
                          }`}
                        >
                          {step}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Troubleshooting */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Additional Troubleshooting
                </h3>
                <div className="space-y-3">
                  {article.troubleshooting.map((tip: string, index: number) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-orange-800">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Visual Guide */}
              {article.hasImage && article.images && article.images.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                    Visual Guide
                  </h3>
                  <div className="space-y-4">
                    {article.images.map((imageSrc: string, index: number) => (
                      <div key={index} className="relative group">
                        <div 
                          className="relative cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-blue-200 hover:border-blue-400 transition-all duration-300 group-hover:shadow-lg"
                          onClick={() => openImageModal(index)}
                        >
                          <img 
                            src={imageSrc} 
                            alt={`Guide step ${index + 1}`}
                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%236b7280' font-size='16'%3EScreenshot Guide %23${index + 1}%3C/text%3E%3C/svg%3E`;
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-2">
                              <ZoomIn className="w-5 h-5 text-gray-800" />
                            </div>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            Step {index + 1}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-gray-600" />
                  Quick Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Device</span>
                    <span className="text-sm font-medium text-gray-900">{article.device}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Action Type</span>
                    <span className="text-sm font-medium text-gray-900">{article.actionType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Priority</span>
                    <span className="text-sm font-medium text-gray-900">{article.priority}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Difficulty</span>
                    <span className="text-sm font-medium text-gray-900">{article.difficulty}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Est. Time</span>
                    <span className="text-sm font-medium text-gray-900">{article.estimatedTime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Steps</span>
                    <span className="text-sm font-medium text-gray-900">{totalSteps}</span>
                  </div>
                </div>
              </div>

              {/* Back to Help */}
              <div className="bg-cyan-50 rounded-lg border border-cyan-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-cyan-900 mb-2">Butuh Bantuan Lain?</h3>
                <p className="text-sm text-cyan-700 mb-4">
                  Jelajahi artikel bantuan lainnya untuk menyelesaikan masalah teknis Anda.
                </p>
                <Link 
                  href="/help"
                  className="w-full block text-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors"
                >
                  Kembali ke Bantuan
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="text-center">
              <p className="text-gray-400 text-xs">
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

      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-zoomIn {
          animation: zoomIn 0.3s ease-out;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .animate-zoomIn {
            animation: fadeIn 0.3s ease-out;
          }
        }
      `}</style>
    </>
  );
};

export default HelpDetails;