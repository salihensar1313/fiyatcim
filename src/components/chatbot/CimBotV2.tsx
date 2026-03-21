"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import type { ChatMessage, ConversationContext } from "./types";
import {
  processMessage,
  createInitialContext,
  getGreetingMessage,
  getAngryGreeting,
} from "./engine/conversation";
import MessageBubble from "./components/MessageBubble";
import TypingIndicator from "./components/TypingIndicator";
import FAB from "./components/FAB";
import Image from "next/image";

// ─── Helpers ───
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── Chat History (localStorage) ───
const STORAGE_KEY = "cimbot-v2-messages";
const MAX_STORED = 50;

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]) {
  try {
    const toSave = messages.slice(-MAX_STORED);
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)); } catch {}
      });
    } else {
      setTimeout(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)); } catch {}
      }, 0);
    }
  } catch {}
}

// ─── Context Persistence ───
const CTX_KEY = "cimbot-v2-context";

function loadContext(): ConversationContext | null {
  try {
    const raw = localStorage.getItem(CTX_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveContext(ctx: ConversationContext) {
  try {
    // Don't persist products or large arrays
    const toSave = { ...ctx, lastShownProducts: [], allShownProductIds: [] };
    localStorage.setItem(CTX_KEY, JSON.stringify(toSave));
  } catch {}
}

// ─── Main Component ───
export default function CimBotV2() {
  const router = useRouter();
  const { addItem } = useCart();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const contextRef = useRef<ConversationContext>(createInitialContext());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);
  const renderedIdsRef = useRef<Set<string>>(new Set());

  // ─── Load history on mount ───
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const savedMsgs = loadMessages();
    const savedCtx = loadContext();

    if (savedCtx) {
      contextRef.current = {
        ...savedCtx,
        lastShownProducts: [],
        showMoreOffset: savedCtx.showMoreOffset ?? 0,
        allShownProductIds: savedCtx.allShownProductIds ?? [],
      };
    }

    if (savedMsgs.length > 0) {
      setMessages(savedMsgs);
    }
  }, []);

  // ─── Auto-scroll (only if user is near bottom) ───
  useEffect(() => {
    const container = document.getElementById("cimbot-messages");
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // ─── Focus input on open ───
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setUnreadCount(0);

      // Show greeting if no messages
      if (messages.length === 0) {
        showGreeting();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ─── Show initial greeting ───
  const showGreeting = useCallback(() => {
    const ctx = contextRef.current;
    const text = ctx.isAngry && ctx.challengeId
      ? getAngryGreeting(ctx.challengeId)
      : getGreetingMessage(
          ctx.preferredCategory
            ? { category: ctx.preferredCategory, categoryName: ctx.preferredCategoryName }
            : undefined
        );

    const greeting: ChatMessage = {
      id: generateId(),
      from: "bot",
      text,
      timestamp: new Date(),
      quickReplies: ctx.isAngry
        ? undefined
        : [
            { label: "📷 Kamera", value: "Kamera bakıyorum", icon: "📷" },
            { label: "🔔 Alarm", value: "Alarm sistemi arıyorum", icon: "🔔" },
            { label: "🔒 Akıllı Kilit", value: "Akıllı kilit istiyorum", icon: "🔒" },
            { label: "🎁 Paket Set", value: "Komple kamera seti göster", icon: "🎁" },
            { label: "🔥 İndirimler", value: "İndirimdeki ürünler", icon: "🔥" },
          ],
    };

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages([greeting]);
      saveMessages([greeting]);
      contextRef.current = { ...ctx, state: "GREETING", turnCount: 0 };
      saveContext(contextRef.current);
    }, 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Send message ───
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setInputValue("");

      // Add user message
      const userMsg: ChatMessage = {
        id: generateId(),
        from: "user",
        text: trimmed,
        timestamp: new Date(),
        isRead: false,
      };

      setMessages((prev) => {
        const next = [...prev, userMsg];
        saveMessages(next);
        return next;
      });

      // Show typing
      setIsTyping(true);

      try {
        // Process with AI engine
        const { response, updatedContext } = await processMessage(
          trimmed,
          contextRef.current
        );

        contextRef.current = updatedContext;
        saveContext(updatedContext);

        // Simulate typing delay (proportional to response length)
        const delay = Math.min(300 + response.text.length * 8, 2000);

        await new Promise((resolve) => setTimeout(resolve, delay));

        // Add bot response
        const botMsg: ChatMessage = {
          id: generateId(),
          from: "bot",
          text: response.text,
          timestamp: new Date(),
          products: response.products,
          quickReplies: response.quickReplies,
          actions: response.actions,
        };

        setIsTyping(false);
        setMessages((prev) => {
          // Mark previous user message as read
          const updated = prev.map((m) =>
            m.id === userMsg.id ? { ...m, isRead: true } : m
          );
          const next = [...updated, botMsg];
          saveMessages(next);
          return next;
        });

        // If chat is not open, increment unread
        if (!isOpen) {
          setUnreadCount((c) => c + 1);
        }
      } catch {
        setIsTyping(false);
        const errorMsg: ChatMessage = {
          id: generateId(),
          from: "bot",
          text: "Bir sorun oluştu, lütfen tekrar deneyin. 😔",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    },
    [isOpen]
  );

  // ─── Quick reply handler ───
  const handleQuickReply = useCallback(
    (value: string) => {
      // Remove quick replies from last bot message
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.from === "bot" && last.quickReplies) {
          return [...prev.slice(0, -1), { ...last, quickReplies: undefined }];
        }
        return prev;
      });
      sendMessage(value);
    },
    [sendMessage]
  );

  // ─── Add to cart from chat ───
  const handleAddToCart = useCallback(
    (productId: string) => {
      // Find product in last shown products
      const product = contextRef.current.lastShownProducts.find(
        (p) => p.id === productId
      );
      if (product) {
        addItem(product, 1);

        // Confirm in chat
        const confirmMsg: ChatMessage = {
          id: generateId(),
          from: "bot",
          text: `✅ ${product.name} sepete eklendi! (${(product.sale_price || product.price).toLocaleString("tr-TR")}₺)`,
          timestamp: new Date(),
          actions: [
            {
              label: "Sepete Git",
              icon: "cart",
              type: "navigate",
              href: "/sepet",
            },
          ],
          quickReplies: [
            { label: "Alışverişe devam", value: "Başka ürün öner", icon: "🛍️" },
            { label: "Sepete git", value: "Sepeti göster", icon: "🛒" },
          ],
        };
        setMessages((prev) => [...prev, confirmMsg]);
      }
    },
    [addItem]
  );

  // ─── View product ───
  const handleViewProduct = useCallback(
    (slug: string) => {
      router.push(`/urunler/${slug}`);
      setIsOpen(false);
    },
    [router]
  );

  // ─── Form submit ───
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(inputValue);
    },
    [inputValue, sendMessage]
  );

  // ─── Toggle chat ───
  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // ─── Close chat ───
  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  // ─── Clear chat ───
  const clearChat = useCallback(() => {
    setMessages([]);
    contextRef.current = createInitialContext();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CTX_KEY);
    showGreeting();
  }, [showGreeting]);

  return (
    <>
      {/* FAB */}
      <FAB isOpen={isOpen} unreadCount={unreadCount} onClick={toggleChat} />

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-gray-100 dark:bg-dark-800 lg:inset-auto lg:bottom-6 lg:right-6 lg:h-[600px] lg:w-[380px] lg:rounded-2xl lg:shadow-2xl lg:shadow-black/20"
          role="dialog"
          aria-label="CimBot Asistan"
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-primary-600 px-4 py-3 lg:rounded-t-2xl">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <Image src="/images/cimbot.png" alt="CimBot" width={40} height={40} className="h-9 w-9 rounded-full object-cover" unoptimized />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">CimBot <span className="inline-block h-2 w-2 rounded-full bg-green-400"></span></h3>
              <p className="text-[11px] text-white/70">
                {isTyping ? "Yazıyor..." : "7/24 Dijital Asistan"}
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              {/* New Chat / Reset button */}
              <button
                onClick={clearChat}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                aria-label="Yeni sohbet"
                title="Sohbeti sıfırla"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Yeni Sohbet</span>
              </button>
              {/* Close button */}
              <button
                onClick={closeChat}
                className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Kapat"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto overscroll-contain py-3" id="cimbot-messages">
            {messages.map((msg, i) => {
              const isNew = !renderedIdsRef.current.has(msg.id);
              if (isNew) renderedIdsRef.current.add(msg.id);
              const isFirst = i === 0 || messages[i].from !== messages[i - 1].from;
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isFirst={isFirst}
                  isNew={isNew}
                  onQuickReply={handleQuickReply}
                  onAddToCart={handleAddToCart}
                  onViewProduct={handleViewProduct}
                />
              );
            })}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 bg-white px-3 py-3 dark:border-dark-600 dark:bg-dark-700 lg:rounded-b-2xl">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Mesajınızı yazın..."
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:bg-white dark:border-dark-500 dark:bg-dark-600 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-primary-500 dark:focus:bg-dark-500"
                disabled={isTyping}
                autoComplete="off"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={isTyping || !inputValue.trim()}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white transition-all hover:bg-primary-700 disabled:opacity-40 disabled:hover:bg-primary-600"
                aria-label="Gönder"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </form>

            {/* Powered by */}
            <p className="mt-2 text-center text-[10px] text-gray-400 dark:text-gray-500">
              CimBot — Fiyatcim.com Akıllı Asistan
            </p>
          </div>
        </div>
      )}
    </>
  );
}
