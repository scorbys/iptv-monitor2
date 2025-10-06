"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, AlertCircle } from "lucide-react";

interface QuickAction {
  id: number;
  label: string;
  query: string;
}

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
  showDetails?: boolean; // Tambahan untuk toggle
}

const IPTVLiveChat = () => {
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
  const inputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    // Check auth status
    fetch("/api/auth/verify", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        console.log("ðŸ” Auth status:", data);
        if (!data.authenticated) {
          console.warn("âš ï¸ User not authenticated!");
        }
      })
      .catch((err) => console.error("Auth check failed:", err));
  }, []);

  useEffect(() => {
    const handleOpenChat = (event: CustomEvent) => {
      const { notification, channel } = event.detail;

      setIsOpen(true);

      // Handle channel context (dari ChannelDetailsPage)
      if (channel) {
        const contextMessage =
          channel.contextMessage ||
          `Saya butuh bantuan dengan Channel ${channel.channelName} (${channel.channelNumber})`;

        setInputMessage(contextMessage);

        // Auto-send dengan delay lebih pendek untuk channel analysis
        setTimeout(() => {
          sendMessage(contextMessage);
        }, 300);
        return;
      }

      // Handle notification context (existing code tetap sama)
      if (notification) {
        const deviceType =
          notification.source === "chromecast"
            ? "Chromecast"
            : notification.source === "tv"
            ? "TV IPTV"
            : notification.source === "channel"
            ? "Channel"
            : "device";

        const contextMessage = `Saya ada masalah dengan ${deviceType} ${
          notification.deviceName ? `"${notification.deviceName}"` : ""
        } ${
          notification.roomNo ? `di kamar ${notification.roomNo}` : ""
        }. Status: ${notification.status}. ${
          notification.error ? `Error: ${notification.error}.` : ""
        }${
          notification.errorCategory
            ? ` Kategori error: ${notification.errorCategory}.`
            : ""
        } Bagaimana cara mengatasinya?`;

        setInputMessage(contextMessage);

        setTimeout(() => {
          sendMessage(contextMessage);
        }, 500);
      }
    };

    window.addEventListener("openLiveChat", handleOpenChat as EventListener);

    return () => {
      window.removeEventListener(
        "openLiveChat",
        handleOpenChat as EventListener
      );
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
      const response = await fetch("/api/chat/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        text: `âš ï¸ Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  const quickActions: QuickAction[] = [
    {
      id: 1,
      label: "Status Channel",
      query: "Bagaimana cara cek status channel?",
    },
    { id: 2, label: "Chromecast Error", query: "Chromecast saya bermasalah" },
    { id: 3, label: "TV Offline", query: "TV di kamar offline" },
  ];

  const handleQuickAction = async (query: string) => {
    await sendMessage(query);
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
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 z-50 group"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            !
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  IPTV Support Assistant
                </h3>
                <p className="text-xs text-blue-100 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.type === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : message.isError
                      ? "bg-red-50 text-red-800 border border-red-200 rounded-bl-none"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none"
                  }`}
                >
                  {message.isError && (
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-semibold">Error</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>

                  {/* Detailed Steps (Expandable) */}
                  {message.detailedInfo && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => toggleDetails(message.id)}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors w-full"
                      >
                        {expandedMessageId === message.id
                          ? "â–¼ Sembunyikan Detail"
                          : "â–¶ Lihat Detail Lengkap"}
                      </button>

                      {expandedMessageId === message.id && (
                        <div className="mt-3 space-y-3">
                          {/* Detailed Steps */}
                          {message.detailedInfo.detailedSteps.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-1">
                                ðŸ“‹ Langkah Detail:
                              </p>
                              <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                                {message.detailedInfo.detailedSteps.map(
                                  (step, idx) => (
                                    <li key={idx} className="pl-2">
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
                              <p className="text-xs font-semibold text-orange-700 mb-1">
                                âš ï¸ Troubleshooting:
                              </p>
                              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                                {message.detailedInfo.troubleshooting.map(
                                  (item, idx) => (
                                    <li key={idx} className="pl-2">
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
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        ðŸ’¡ Related Issues:
                      </p>
                      <div className="space-y-1">
                        {message.relatedFAQs.map((faq) => (
                          <button
                            key={faq.id}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded cursor-pointer hover:bg-blue-100 transition-colors w-full text-left"
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
                    className={`text-xs mt-1 ${
                      message.type === "user"
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
                <div className="bg-white text-gray-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-500">Mengetik...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 bg-white border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Quick Actions:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.query)}
                    className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ketik pertanyaan Anda..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Powered by AI â€¢ Available 24/7
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default IPTVLiveChat;
