"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "./AuthContext";

interface Message {
  id: number;
  type: "user" | "bot";
  text: string;
  timestamp: Date;
  relatedFAQs?: Array<{
    id: number;
    issue: string;
    device: string;
    priority: string;
    slug: string;
    solutions?: string[];
  }>;
  detailedInfo?: {
    detailedSteps: string[];
    troubleshooting: string[];
    actionType: string;
    priority: string;
  } | null;
  isError?: boolean;
  showDetails?: boolean;
}

const IPTVLiveChat = () => {
  const { user, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "bot",
      text: "Halo! Saya asisten virtual IPTV Monitoring. Saya dapat membantu Anda dengan masalah Chromecast, IPTV, dan Channel. Ada yang bisa saya bantu?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(
    null
  );

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle ESC key to close chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Handle click outside to close chat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        chatWindowRef.current &&
        !chatWindowRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Manage body scroll when chat is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "auto";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    // Only verify authentication if auth loading is complete AND user is logged in
    if (authLoading) return; // Wait for auth to finish loading
    if (!user) {
      // User not logged in - skip auth check
      console.log("[IPTVLiveChat] User not logged in, skipping auth check");
      return;
    }

    // User is logged in - verify session
    const checkAuth = async () => {
      try {
        // Get token from localStorage (priority for cross-domain)
        const getAuthToken = () => {
          try {
            return (
              localStorage.getItem("authToken") ||
              localStorage.getItem("token") ||
              localStorage.getItem("auth-token") ||
              null
            );
          } catch (e) {
            console.warn("[IPTVLiveChat] Could not access localStorage:", e);
            return null;
          }
        };

        const token = getAuthToken();

        console.log("[IPTVLiveChat] Checking auth with token:", {
          hasToken: !!token,
          tokenLength: token?.length
        });

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        };

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch("/api/auth/verify", {
          credentials: "include",
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            console.log("[IPTVLiveChat] User authenticated:", data.user.username);
          } else {
            console.log("[IPTVLiveChat] User not authenticated");
          }
        } else {
          console.log("[IPTVLiveChat] Auth check failed:", response.status);
        }
      } catch (error) {
        console.error("[IPTVLiveChat] Auth check error:", error);
      }
    };

    checkAuth();
  }, [user, authLoading]);

  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { tv, device, channel } = customEvent.detail;

      setIsOpen(true);

      // Handle Channel context
      if (channel?.contextMessage) {
        const contextMessage = channel.contextMessage;
        setInputMessage(contextMessage);
        setTimeout(() => {
          sendMessage(contextMessage);
        }, 300);
        return;
      }

      // Handle TV context
      if (tv?.contextMessage) {
        const contextMessage = tv.contextMessage;
        setInputMessage(contextMessage);
        setTimeout(() => {
          sendMessage(contextMessage);
        }, 300);
        return;
      }

      // Handle Chromecast context
      if (device?.contextMessage) {
        const contextMessage = device.contextMessage;
        setInputMessage(contextMessage);
        setTimeout(() => {
          sendMessage(contextMessage);
        }, 300);
        return;
      }

      // Handle old notification format (backward compatibility)
      const notification = customEvent.detail.notification;
      if (notification) {
        const deviceType =
          notification.source === "chromecast"
            ? "Chromecast"
            : notification.source === "tv"
              ? "TV IPTV"
              : notification.source === "channel"
                ? "Channel"
                : "device";

        const contextMessage = `Saya ada masalah dengan ${deviceType} ${notification.deviceName ? `"${notification.deviceName}"` : ""
          } ${notification.roomNo ? `di kamar ${notification.roomNo}` : ""}.  Status: ${notification.status}. ${notification.error ? `Error: ${notification.error}.` : ""
          }${notification.errorCategory
            ? ` Kategori error: ${notification.errorCategory}.`
            : ""
          } Bagaimana cara mengatasinya?`;

        setInputMessage(contextMessage);
        setTimeout(() => {
          sendMessage(contextMessage);
        }, 500);
      }
    };

    window.addEventListener("openLiveChat", handleOpenChat);

    return () => {
      window.removeEventListener("openLiveChat", handleOpenChat);
    };
  }, []);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      type: "user",
      text: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Get token from localStorage for Authorization header
      const getAuthToken = () => {
        try {
          return (
            localStorage.getItem("authToken") ||
            localStorage.getItem("token") ||
            localStorage.getItem("auth-token") ||
            null
          );
        } catch (e) {
          console.warn("[IPTVLiveChat] Could not access localStorage:", e);
          return null;
        }
      };

      const token = getAuthToken();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/chat/query", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          message: messageText,
          conversationHistory: messages.slice(-5).map((m) => ({
            role: m.type === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      const botMessage: Message = {
        id: Date.now() + 1,
        type: "bot",
        text: data.response || "Maaf, tidak ada respons dari server.",
        relatedFAQs: data.relatedFAQs || [],
        detailedInfo: data.detailedInfo || null,
        timestamp: new Date(),
        showDetails: false,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: "bot",
        text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        isError: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    await sendMessage(inputMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleDetails = (messageId: number) => {
    setExpandedMessageId(expandedMessageId === messageId ? null : messageId);
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-23 right-4 md:bottom-4 md:right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 z-50 group"
          aria-label="Open chat"
        >
          <MessageCircle className="w-3 h-3" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            !
          </span>
        </button>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 md:bg-transparent z-40 md:pointer-events-none"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatWindowRef}
          className="fixed bottom-22 left-3 right-3 top-80 md:bottom-4 md:right-6 md:left-auto md:top-auto md:w-96 md:h-[480px] w-auto md:rounded-2xl bg-white rounded-2xl flex flex-col z-50 border-t md:border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 md:p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm md:text-base">
                  IPTV Support Assistant
                </h3>
                <p className="text-[10px] md:text-xs text-blue-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1.5 md:p-2 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-3 py-2 ${message.type === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : message.isError
                        ? "bg-red-50 text-red-800 border border-red-200 rounded-bl-none"
                        : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none"
                    }`}
                >
                  {message.isError && (
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      <span className="text-[10px] md:text-xs font-semibold">Error</span>
                    </div>
                  )}
                  <p className="text-xs md:text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.text}
                  </p>

                  {/* Detailed Steps (Expandable) */}
                  {message.detailedInfo && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => toggleDetails(message.id)}
                        className="text-[10px] md:text-xs bg-blue-600 text-white px-2.5 py-1.5 rounded-full hover:bg-blue-700 transition-colors w-full"
                      >
                        {expandedMessageId === message.id
                          ? "▼ Sembunyikan Detail"
                          : "▶ Lihat Detail Lengkap"}
                      </button>

                      {expandedMessageId === message.id && (
                        <div className="mt-2 space-y-2">
                          {/* Detailed Steps */}
                          {message.detailedInfo.detailedSteps.length > 0 && (
                            <div>
                              <p className="text-[10px] md:text-xs font-semibold text-gray-700 mb-1">
                                Langkah Detail:
                              </p>
                              <ol className="text-[10px] md:text-xs text-gray-600 space-y-0.5 list-decimal list-inside">
                                {message.detailedInfo.detailedSteps.map(
                                  (step, idx) => (
                                    <li key={idx} className="pl-1 leading-relaxed">
                                      {step}
                                    </li>
                                  )
                                )}
                              </ol>
                            </div>
                          )}

                          {/* Troubleshooting */}
                          {message.detailedInfo.troubleshooting.length > 0 && (
                            <div>
                              <p className="text-[10px] md:text-xs font-semibold text-orange-700 mb-1">
                                Troubleshooting:
                              </p>
                              <ul className="text-[10px] md:text-xs text-gray-600 space-y-0.5 list-disc list-inside">
                                {message.detailedInfo.troubleshooting.map(
                                  (item, idx) => (
                                    <li key={idx} className="pl-1 leading-relaxed">
                                      {item}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Related FAQs */}
                  {message.relatedFAQs && message.relatedFAQs.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-[10px] md:text-xs font-semibold text-gray-600 mb-1.5">
                        Related Issues:
                      </p>
                      <div className="space-y-1">
                        {message.relatedFAQs.map((faq) => (
                          <button
                            key={faq.id}
                            className="text-[10px] md:text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded cursor-pointer hover:bg-blue-100 transition-colors w-full text-left"
                            onClick={() =>
                              setInputMessage(
                                `Bagaimana cara mengatasi: ${faq.issue}`
                              )
                            }
                          >
                            {faq.device}: {faq.issue}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <p
                    className={`text-[10px] md:text-xs mt-1 ${message.type === "user"
                        ? "text-blue-200"
                        : "text-gray-400"
                      }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 rounded-2xl rounded-bl-none px-3 py-2 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin text-blue-600" />
                    <span className="text-xs md:text-sm text-gray-500">Mengetik...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ketik pertanyaan..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-xs md:text-sm resize-none max-h-20 min-h-[40px]"
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IPTVLiveChat;