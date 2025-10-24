"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from "next/image";
import {
    XMarkIcon,
    EnvelopeIcon,
    DocumentTextIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface BillItem {
    name: string;
    price: number;
    quantity: number;
}

// Menu items with proper icons
const menuItems = [
    {
        id: 1,
        label: 'LIVE TV',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="7" width="20" height="13" rx="2" />
                <path d="M17 2l-5 5-5-5" />
            </svg>
        ),
        href: '#'
    },
    {
        id: 2,
        label: 'CONNECT DEVICE',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
        ),
        href: '#'
    },
    {
        id: 3,
        label: 'ENTERTAINMENT',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
        ),
        href: '#'
    },
    {
        id: 4,
        label: 'APPLE TV',
        icon: (
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
        ),
        href: '#'
    },
    {
        id: 5,
        label: 'HOTEL INFO',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
        ),
        href: '#'
    },
    {
        id: 6,
        label: 'WHAT TO DO',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
            </svg>
        ),
        href: '#'
    },
    {
        id: 7,
        label: 'PROMOTIONS',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
        ),
        href: '#'
    },
    {
        id: 8,
        label: 'ROOM DINING',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zM21 15v7" />
            </svg>
        ),
        href: '#'
    },
    {
        id: 9,
        label: 'HOUSEKEEPING',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        ),
        href: '#'
    },
    {
        id: 10,
        label: 'SPA & FITNESS',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
        ),
        href: '#'
    },
    {
        id: 11,
        label: 'FLIGHT INFO',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
        ),
        href: '#'
    },
];

// Messages data dengan full content dan tanggal otomatis
const getCurrentDate = () => {
    const now = new Date();
    const day = now.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const messagesData = [
    {
        id: 1,
        header: 'Welcome to Radisson Blu Bali Uluwatu!',
        content: 'Om Swastiastu! (Balinese greeting meaning "May you always be in good condition by the grace of God")',
        fullContent: `Welcome to Radisson Blu Bali Uluwatu!

Om Swastiastu!
(Balinese greeting meaning "May you always be in good condition by the grace of God")

Thank you for choosing to stay with us. We hope you will find your stay with us both relaxing and enjoyable. We would like to inform you that there are some building projects taking place in our neighborhood, and there will be some potential sound pollution as a result. Unfortunately, this is beyond our control, and we have already informed the concerned parties that noise should be kept to a minimum. Should you need any assistance during your stay, simply press the One Touch Service button on your in-room telephone.

Matur Suksma.
(Balinese gratitude meaning "Thank you very much")

Best Regards,
Radisson Blu Bali Uluwatu team`,
        date: getCurrentDate(),
    },
];

// Bill data structure
const billData: {
    items: BillItem[];
    total: number;
} = {
    items: [],
    total: 0,
};

interface IPTVPreviewProps {
    iptvName: string;
    isOnline: boolean;
    onClose: () => void;
}

export default function IPTVPreview({ iptvName, isOnline, onClose }: IPTVPreviewProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showMessages, setShowMessages] = useState(false);
    const [showBill, setShowBill] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<typeof messagesData[0] | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Format time (HH:MM)
    const formatTime = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    // Format date (Oct 21)
    const formatDate = (date: Date) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = date.getDate();
        const month = months[date.getMonth()];
        return `${month} ${day}`;
    };

    // Scroll menu functions
    const scrollMenu = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            const newScrollLeft = direction === 'left'
                ? scrollContainerRef.current.scrollLeft - scrollAmount
                : scrollContainerRef.current.scrollLeft + scrollAmount;

            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    // Handle ESC key press
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (selectedMessage) {
                    setSelectedMessage(null);
                } else if (showMessages) {
                    setShowMessages(false);
                } else if (showBill) {
                    setShowBill(false);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [showMessages, showBill, selectedMessage, onClose]);

    // Offline screen
    if (!isOnline) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-white hover:text-gray-300 transition-colors z-10 bg-black/30 backdrop-blur-sm p-1.5 rounded-md"
                >
                    <XMarkIcon className="w-4 h-4" />
                </button>
                <div className="text-center">
                    <div className="text-white text-3xl font-light mb-4">TV is Offline</div>
                    <div className="text-gray-400 text-lg">Press ESC or click X to close</div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black z-50" onClick={onClose}>
            <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
                {/* Video Background */}
                <video
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                >
                    <source src="/Nettif-IPTVCast-Preview.mp4" type="video/mp4" />
                </video>

                {/* Overlay Content */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Top Bar */}
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/40 to-transparent p-4">
                        <div className="flex items-center justify-between">
                            {/* Hotel Logo & Welcome */}
                            <div className="flex items-center gap-2">
                                <Image
                                    src="/logo-white.png"
                                    alt="Logo"
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 object-contain drop-shadow-lg"
                                />
                                <h1 className="text-white text-sm font-medium drop-shadow-sm">
                                    Welcome Mr. John Doe
                                </h1>
                            </div>

                            {/* Time, Date & Demo TV Info */}
                            <div className="flex items-center gap-3">
                                <div className="text-white text-sm font-medium">
                                    {formatTime(currentTime)}
                                </div>
                                <div className="text-white text-sm font-medium">
                                    {formatDate(currentTime)}
                                </div>
                                <div className="flex items-center gap-1.5 bg-blue-600/70 backdrop-blur-sm px-2.5 py-1 rounded-md">
                                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <circle cx="6.18" cy="17.82" r="2.18" />
                                        <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z" />
                                    </svg>
                                    <div className="text-white text-sm font-medium">{iptvName}</div>
                                </div>
                            </div>
                        </div>

                        {/* Message & Bill Icons */}
                        <div className="flex justify-end mt-1">
                            <div className="flex flex-row gap-2 pointer-events-auto">
                                <button
                                    onClick={() => setShowMessages(true)}
                                    className="bg-white/15 backdrop-blur-sm p-2 rounded-md hover:bg-white/25 transition-all hover:scale-105 shadow-md"
                                    title="Messages"
                                >
                                    <EnvelopeIcon className="w-4 h-4 text-white" />
                                </button>
                                <button
                                    onClick={() => setShowBill(true)}
                                    className="bg-white/15 backdrop-blur-sm p-2 rounded-md hover:bg-white/25 transition-all hover:scale-105 shadow-md"
                                    title="View Bill"
                                >
                                    <DocumentTextIcon className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Menu Bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent pt-24 sm:pt-28 pb-3 sm:pb-2">
                        <div className="relative flex items-center justify-center px-4 sm:px-12">
                            {/* Left Arrow Button */}
                            <button
                                onClick={() => scrollMenu('left')}
                                className="pointer-events-auto absolute left-4 sm:left-8 lg:left-30 z-10 bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-full hover:bg-white/30 transition-all hover:scale-110 shadow-lg"
                            >
                                <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </button>

                            {/* Scrollable Menu Container */}
                            <div
                                ref={scrollContainerRef}
                                className="overflow-x-scroll overflow-y-visible pointer-events-auto max-w-5xl cursor-grab active:cursor-grabbing"
                                style={{
                                    scrollBehavior: 'auto',
                                    WebkitOverflowScrolling: 'touch',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none',
                                }}
                                onMouseDown={(e) => {
                                    const ele = e.currentTarget;
                                    const startX = e.pageX - ele.offsetLeft;
                                    const scrollLeft = ele.scrollLeft;
                                    let isDragging = false;

                                    ele.style.cursor = 'grabbing';
                                    ele.style.userSelect = 'none';
                                    ele.style.scrollBehavior = 'auto';

                                    const onMouseMove = (moveEvent: MouseEvent) => {
                                        isDragging = true;
                                        moveEvent.preventDefault();
                                        const x = moveEvent.pageX - ele.offsetLeft;
                                        const walk = (x - startX) * 1.5;
                                        ele.scrollLeft = scrollLeft - walk;
                                    };

                                    const onMouseUp = (e: MouseEvent) => {
                                        ele.style.cursor = 'grab';
                                        ele.style.removeProperty('user-select');

                                        // Prevent click event if dragging
                                        if (isDragging) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }

                                        document.removeEventListener('mousemove', onMouseMove);
                                        document.removeEventListener('mouseup', onMouseUp);
                                        document.removeEventListener('mouseleave', onMouseLeave);

                                        // Reset dragging flag after a short delay
                                        setTimeout(() => {
                                            isDragging = false;
                                        }, 100);
                                    };

                                    const onMouseLeave = () => {
                                        // Stop dragging when mouse leaves the window
                                        ele.style.cursor = 'grab';
                                        ele.style.removeProperty('user-select');

                                        document.removeEventListener('mousemove', onMouseMove);
                                        document.removeEventListener('mouseup', onMouseUp);
                                        document.removeEventListener('mouseleave', onMouseLeave);
                                    };

                                    document.addEventListener('mousemove', onMouseMove);
                                    document.addEventListener('mouseup', onMouseUp);
                                    document.addEventListener('mouseleave', onMouseLeave);
                                }}
                                onClick={(e) => {
                                    // Prevent click if we were dragging
                                    const ele = e.currentTarget;
                                    if (ele.getAttribute('data-dragging') === 'true') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }
                                }}
                            >
                                <div className="flex items-end gap-6 sm:gap-9 px-4 sm:px-6 pb-4 pt-6">
                                    {menuItems.map((item) => (
                                        <a
                                            key={item.id}
                                            href={item.href}
                                            className="pointer-events-auto flex flex-col items-center gap-1.5 sm:gap-2 min-w-[75px] sm:min-w-[90px] max-w-[75px] sm:max-w-[90px] transition-all duration-300 group hover:-translate-y-3 sm:hover:-translate-y-4 hover:scale-110"
                                        >
                                            <div className="text-white transition-all duration-300 group-hover:drop-shadow-2xl w-6 h-6 sm:w-7 sm:h-7">
                                                {item.icon}
                                            </div>
                                            <span className="text-white text-[9px] sm:text-[10px] font-semibold text-center uppercase leading-tight transition-all duration-300 group-hover:drop-shadow-lg break-words w-full">
                                                {item.label}
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Right Arrow Button */}
                            <button
                                onClick={() => scrollMenu('right')}
                                className="pointer-events-auto absolute right-4 sm:right-8 lg:right-30 z-10 bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-full hover:bg-white/30 transition-all hover:scale-110 shadow-lg"
                            >
                                <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </button>
                        </div>
                    </div>

                    <style jsx>{`
    div::-webkit-scrollbar {
        display: none;
    }
`}</style>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 pointer-events-auto bg-black/30 backdrop-blur-sm p-1.5 rounded-md hover:bg-black/50 transition-all"
                    >
                        <XMarkIcon className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* Messages Modal */}
                {showMessages && !selectedMessage && (
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-auto"
                        onClick={() => setShowMessages(false)}
                    >
                        <div
                            className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl max-w-3xl w-full mx-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Messages</h2>

                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-sm">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border-b border-gray-300">Num</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border-b border-gray-300">Header</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border-b border-gray-300">Content</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border-b border-gray-300">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border-b border-gray-300">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {messagesData.map((msg, index) => (
                                                <tr key={msg.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-gray-900">{index + 1}</td>
                                                    <td className="px-4 py-3 text-gray-900 font-medium">{msg.header}</td>
                                                    <td className="px-4 py-3 text-gray-700 text-xs">
                                                        {msg.content.length > 80
                                                            ? `${msg.content.substring(0, 80)}...`
                                                            : msg.content}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">
                                                        {msg.date}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() => setSelectedMessage(msg)}
                                                            className="bg-green-500 text-white px-4 py-1.5 rounded-lg hover:bg-green-600 transition-colors text-xs font-medium shadow-sm"
                                                        >
                                                            Preview
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-6 text-center">
                                    <button
                                        onClick={() => setShowMessages(false)}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-md"
                                    >
                                        Back
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Message Preview Modal */}
                {selectedMessage && (
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center pointer-events-auto"
                        onClick={() => setSelectedMessage(null)}
                    >
                        <div
                            className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl max-w-2xl w-full mx-6 max-h-[80vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8">
                                {/* Hotel Logo */}
                                <div className="flex justify-center mb-6">
                                    <Image
                                        src="/logo-black.png"
                                        alt="Hotel Logo"
                                        width={80}
                                        height={80}
                                        className="w-20 h-20 object-contain opacity-80"
                                    />
                                </div>

                                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                                    {selectedMessage.header}
                                </h2>

                                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                                    {selectedMessage.fullContent}
                                </div>

                                <div className="mt-8 text-center">
                                    <button
                                        onClick={() => setSelectedMessage(null)}
                                        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-md"
                                    >
                                        OK
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bill Modal */}
                {showBill && (
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-auto"
                        onClick={() => setShowBill(false)}
                    >
                        <div
                            className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl max-w-3xl w-full mx-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">View Bill</h2>

                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-sm">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border-b border-gray-300">Num</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border-b border-gray-300">Item</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 border-b border-gray-300">Price</th>
                                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border-b border-gray-300">Quantity</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 border-b border-gray-300">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {billData.items.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                        No items in bill
                                                    </td>
                                                </tr>
                                            ) : (
                                                billData.items.map((item: BillItem, index: number) => (
                                                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-gray-900">{index + 1}</td>
                                                        <td className="px-4 py-3 text-gray-900">{item.name}</td>
                                                        <td className="px-4 py-3 text-right text-gray-900">${item.price}</td>
                                                        <td className="px-4 py-3 text-center text-gray-900">{item.quantity}</td>
                                                        <td className="px-4 py-3 text-right text-gray-900 font-medium">
                                                            ${(item.price * item.quantity).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-6 text-center">
                                    <button
                                        onClick={() => setShowBill(false)}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-md"
                                    >
                                        Back
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}