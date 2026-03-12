"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, RotateCcw, ExternalLink, Phone, Mail } from "lucide-react";
import { CONTACT } from "@/lib/constants";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

interface Action {
  label: string;
  icon?: "link" | "phone" | "email" | "reset";
  type: "navigate" | "phone" | "email" | "reset";
  href?: string;
}

interface QuickReply {
  id: string;
  icon: string;
  label: string;
}

interface BotResponse {
  text: string;
  actions: Action[];
}

interface Message {
  id: string;
  from: "bot" | "user";
  text: string;
  timestamp: Date;
}

/* ─────────────────────────────────────────────
   Predefined Data
   ───────────────────────────────────────────── */

const QUICK_REPLIES: QuickReply[] = [
  { id: "order", icon: "📦", label: "Sipariş Takibi" },
  { id: "camera", icon: "🎥", label: "Kamera Kurulumu" },
  { id: "shipping", icon: "🚚", label: "Kargo ve Teslimat" },
  { id: "support", icon: "🔧", label: "Teknik Destek" },
  { id: "returns", icon: "🔁", label: "İade ve Garanti" },
  { id: "contact", icon: "📞", label: "İletişim" },
];

const BOT_RESPONSES: Record<string, BotResponse> = {
  order: {
    text: "Oo sipariş meraklısı! 🕵️ Paketinin nerede olduğunu merak ediyorsan hemen Siparişlerim sayfasına bi' bak derim. Sipariş numaran varsa oradan takip edebilirsin, kolay gelsin! 😎",
    actions: [
      { label: "Siparişlerime Git", icon: "link", type: "navigate", href: "/hesabim/siparislerim" },
      { label: "Başka Sorum Var", icon: "reset", type: "reset" },
    ],
  },
  camera: {
    text: "Kamera kurulumu ha? Güzel iş! 📸 Biz ücretsiz keşif yapıyoruz, yani ekibimiz gelip en uygun kamera noktalarını belirliyor. Sonra profesyonel kurulum — sen çayını iç, biz hallederiz! ☕",
    actions: [
      { label: "İletişim Formu", icon: "link", type: "navigate", href: "/iletisim" },
      { label: "Hemen Ara", icon: "phone", type: "phone", href: `tel:${CONTACT.phone.replace(/[^0-9+]/g, "")}` },
      { label: "Başka Sorum Var", icon: "reset", type: "reset" },
    ],
  },
  shipping: {
    text: "Kargo dediğin şey sabır işi ama biz hızlıyız! 🏃💨\n\n🎁 2.000₺ üzeri = Ücretsiz kargo (evet, bedava!)\n📦 Standart teslimat: 1-3 iş günü\n🔧 Kurulumlu ürünler: Randevu ile teslim\n\nYani çok beklemezsin merak etme!",
    actions: [
      { label: "Kargom Nerede?", icon: "link", type: "navigate", href: "/hesabim/siparislerim" },
      { label: "Başka Sorum Var", icon: "reset", type: "reset" },
    ],
  },
  support: {
    text: `Teknik bir sıkıntı mı var? Sakin ol, CimBot burada! 🦸\n\nEkibimiz ${CONTACT.workingHours} saatleri arasında hazır kıta bekliyor. Kurulum, arıza, "bu düğme ne işe yarıyor" tarzı her şeyi sorabilirsin! 😄`,
    actions: [
      { label: "Hemen Ara", icon: "phone", type: "phone", href: `tel:${CONTACT.phone.replace(/[^0-9+]/g, "")}` },
      { label: "E-posta At", icon: "email", type: "email", href: `mailto:${CONTACT.email}` },
      { label: "Başka Sorum Var", icon: "reset", type: "reset" },
    ],
  },
  returns: {
    text: "İade mi? Sorun değil, biz anlayışlıyız! 🤝\n\n✅ 14 gün koşulsuz iade hakkın var\n🛡️ Tüm ürünlerde minimum 2 yıl garanti\n\nBeğenmediysen, fikrini değiştirdiysen — olur böyle şeyler! Hesabından iade talebi oluşturabilirsin.",
    actions: [
      { label: "İade Talebi Oluştur", icon: "link", type: "navigate", href: "/hesabim" },
      { label: "Başka Sorum Var", icon: "reset", type: "reset" },
    ],
  },
  contact: {
    text: `Bize ulaşmak mı istiyorsun? Kapımız her zaman açık! 🚪😊\n\n📞 ${CONTACT.phone}\n✉️ ${CONTACT.email}\n📍 ${CONTACT.address}\n🕐 ${CONTACT.workingHours}\n\nAra, yaz, gel — nasıl istersen!`,
    actions: [
      { label: "İletişim Sayfası", icon: "link", type: "navigate", href: "/iletisim" },
      { label: "Başka Sorum Var", icon: "reset", type: "reset" },
    ],
  },
};

const GREETING_TEXT = "Selamm! 🤖✌️\nBen CimBot, Fiyatcim'in en çalışkan dijital asistanıyım!\n\nAşağıdan bir konu seç, hemen yardımcı olayım 👇";
const TOOLTIP_KEY = "fiyatcim_chatbot_tooltip_shown";
const NUDGE_INTERVAL = 45_000; // 45 saniye

const NUDGE_MESSAGES = [
  "Yardıma mı ihtiyacın var? 🤗",
  "Bir sorun mu var? Yardımcı olabilirim! 💬",
  "Hey! Aradığını bulamadın mı? 🔍",
  "CimBot burada! Bir şey soracak mısın? 😊",
  "Bana tıkla, sana yardım edeyim! 🚀",
  "Selamm! Bir şeye mi bakıyorsun? 👀",
];

/* ─────────────────────────────────────────────
   Typing Indicator
   ───────────────────────────────────────────── */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-dark-100 px-4 py-3 dark:bg-dark-700">
      <span className="h-2 w-2 animate-bounce rounded-full bg-dark-400 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-dark-400 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-dark-400 [animation-delay:300ms]" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Action Button Icons
   ───────────────────────────────────────────── */

function ActionIcon({ type }: { type: Action["icon"] }) {
  switch (type) {
    case "phone":
      return <Phone size={14} />;
    case "email":
      return <Mail size={14} />;
    case "reset":
      return <RotateCcw size={14} />;
    default:
      return <ExternalLink size={14} />;
  }
}

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeQuickReplies, setActiveQuickReplies] = useState<QuickReply[]>(QUICK_REPLIES);
  const [activeActions, setActiveActions] = useState<Action[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [nudgeText, setNudgeText] = useState("");
  const [showNudge, setShowNudge] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* ─── Auto-scroll ─── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  /* ─── Tooltip on first visit ─── */
  useEffect(() => {
    const shown = safeGetJSON<boolean>(TOOLTIP_KEY, false);
    if (!shown) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        safeSetJSON(TOOLTIP_KEY, true);
        setTimeout(() => setShowTooltip(false), 5000);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  /* ─── Periodic nudge notifications ─── */
  useEffect(() => {
    if (isOpen) {
      setShowNudge(false);
      return;
    }

    const interval = setInterval(() => {
      // Don't show if panel is open
      if (isOpen) return;

      // Pick a random nudge message
      const msg = NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];
      setNudgeText(msg);
      setShowNudge(true);

      // Auto-hide after 6 seconds
      setTimeout(() => setShowNudge(false), 6000);
    }, NUDGE_INTERVAL);

    return () => clearInterval(interval);
  }, [isOpen]);

  /* ─── Cleanup ─── */
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  /* ─── Initialize with greeting ─── */
  const initChat = useCallback(() => {
    if (!initialized) {
      setMessages([
        {
          id: "greeting",
          from: "bot",
          text: GREETING_TEXT,
          timestamp: new Date(),
        },
      ]);
      setActiveQuickReplies(QUICK_REPLIES);
      setActiveActions([]);
      setInitialized(true);
    }
  }, [initialized]);

  /* ─── Open panel ─── */
  const handleOpen = () => {
    setIsOpen(true);
    setShowTooltip(false);
    initChat();
  };

  /* ─── Handle quick reply click ─── */
  const handleQuickReply = (reply: QuickReply) => {
    // Guard: prevent duplicate clicks while bot is typing
    if (isTyping) return;

    const response = BOT_RESPONSES[reply.id];
    if (!response) return;

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      from: "user",
      text: `${reply.icon} ${reply.label}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setActiveQuickReplies([]);
    setActiveActions([]);
    setIsTyping(true);

    // Simulate typing delay
    typingTimeoutRef.current = setTimeout(() => {
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        from: "bot",
        text: response.text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setActiveActions(response.actions);
      setIsTyping(false);
    }, 800);
  };

  /* ─── Handle action click ─── */
  const handleAction = (action: Action) => {
    if (action.type === "reset") {
      // Show menu again
      const resetTexts = [
        "Tabii tabii, sor bakalım başka ne var aklında? 🤔",
        "Buyur buyur, CimBot hizmete devam! 💪",
        "Daha ne soracaksın merak ettim, haydi seç! 😄",
        "Ana menüye döndük! Başka ne lazım patron? 🫡",
      ];
      const botMsg: Message = {
        id: `bot-reset-${Date.now()}`,
        from: "bot",
        text: resetTexts[Math.floor(Math.random() * resetTexts.length)],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setActiveQuickReplies(QUICK_REPLIES);
      setActiveActions([]);
    }
    // navigate, phone, email are handled by <a> or <Link> — no state change needed
  };

  /* ─── Format time ─── */
  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-20 right-4 z-[60] sm:bottom-6 sm:right-6">
      {/* ─── Chat Panel ─── */}
      {isOpen && (
        <div className="mb-3 flex w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-dark-200 dark:bg-dark-900 dark:ring-dark-700 sm:w-96"
          style={{ maxHeight: "min(500px, 70vh)" }}
          role="dialog"
          aria-label="CimBot Destek Asistanı"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-primary-600 px-4 py-3">
            <div className="flex items-center gap-3">
              <Image
                src="/images/cimbot.png"
                alt="CimBot"
                width={36}
                height={36}
                className="h-9 w-9 rounded-full bg-white object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-white">CimBot 🤖</p>
                <p className="text-xs text-white/70">7/24 Dijital Asistan</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="CimBot'u kapat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4" style={{ minHeight: "200px" }}>
            <div className="flex flex-col gap-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 text-sm ${
                      msg.from === "bot"
                        ? "rounded-2xl rounded-tl-sm bg-dark-100 text-dark-800 dark:bg-dark-700 dark:text-dark-100"
                        : "rounded-2xl rounded-tr-sm bg-primary-600 text-white"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <p
                      className={`mt-1.5 text-right text-[10px] ${
                        msg.from === "bot" ? "text-dark-400" : "text-white/60"
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <TypingIndicator />
                </div>
              )}

              {/* Quick Reply Chips */}
              {activeQuickReplies.length > 0 && !isTyping && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {activeQuickReplies.map((reply) => (
                    <button
                      key={reply.id}
                      onClick={() => handleQuickReply(reply)}
                      className="rounded-full border border-primary-300 px-3 py-2 text-sm text-primary-600 transition-colors hover:border-primary-500 hover:bg-primary-50 dark:border-primary-500 dark:text-primary-400 dark:hover:bg-primary-950"
                    >
                      {reply.icon} {reply.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              {activeActions.length > 0 && !isTyping && (
                <div className="mt-1 flex flex-col gap-2">
                  {activeActions.map((action) => {
                    const isReset = action.type === "reset";
                    const className = isReset
                      ? "flex w-full items-center justify-center gap-2 rounded-lg border border-dark-200 bg-dark-50 px-4 py-2.5 text-sm font-medium text-dark-600 transition-colors hover:bg-dark-100 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-300 dark:hover:bg-dark-700"
                      : "flex w-full items-center justify-center gap-2 rounded-lg bg-primary-50 px-4 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 dark:bg-primary-950 dark:text-primary-300 dark:hover:bg-primary-900";

                    if (action.type === "reset") {
                      return (
                        <button
                          key={action.label}
                          onClick={() => handleAction(action)}
                          className={className}
                        >
                          <ActionIcon type={action.icon} />
                          {action.label}
                        </button>
                      );
                    }

                    if (action.type === "phone" || action.type === "email") {
                      return (
                        <a
                          key={action.label}
                          href={action.href}
                          className={className}
                        >
                          <ActionIcon type={action.icon} />
                          {action.label}
                        </a>
                      );
                    }

                    // navigate
                    return (
                      <Link
                        key={action.label}
                        href={action.href || "/"}
                        className={className}
                      >
                        <ActionIcon type={action.icon} />
                        {action.label}
                      </Link>
                    );
                  })}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Bottom Helper Text */}
          <div className="border-t border-dark-100 px-4 py-3 dark:border-dark-700">
            <p className="text-center text-xs text-dark-400">
              Bir konu seç, CimBot hemen cevaplasın! 🚀
            </p>
          </div>
        </div>
      )}

      {/* ─── Tooltip (first visit) ─── */}
      {showTooltip && !isOpen && !showNudge && (
        <div className="absolute bottom-[120px] right-0 mb-2 animate-fade-in whitespace-nowrap rounded-lg bg-dark-900 px-3 py-2 text-sm text-white shadow-lg">
          Selam! Ben CimBot, yardım ister misin? 😊
          <div className="absolute -bottom-1 right-6 h-2 w-2 rotate-45 bg-dark-900" />
        </div>
      )}

      {/* ─── Nudge Notification Bubble ─── */}
      {showNudge && !isOpen && !showTooltip && (
        <div
          className="absolute bottom-[120px] right-0 mb-2 w-[240px] animate-bounce-in cursor-pointer rounded-xl bg-white px-4 py-3 shadow-xl ring-1 ring-dark-100 dark:bg-dark-800 dark:ring-dark-600"
          onClick={() => {
            setShowNudge(false);
            handleOpen();
          }}
        >
          <div className="flex items-center gap-2">
            <Image
              src="/images/cimbot.png"
              alt="CimBot"
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 rounded-full object-cover"
            />
            <p className="text-sm font-medium text-dark-700 dark:text-dark-200">{nudgeText}</p>
          </div>
          <div className="absolute -bottom-1.5 right-7 h-3 w-3 rotate-45 bg-white shadow-sm dark:bg-dark-800" />
        </div>
      )}

      {/* ─── FAB Button ─── */}
      <button
        onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
        className={`group relative flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 ${
          isOpen
            ? "h-12 w-12 bg-dark-700 shadow-lg hover:bg-dark-600 hover:shadow-xl"
            : "h-28 w-28"
        }`}
        aria-label={isOpen ? "CimBot'u kapat" : "CimBot'u aç"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X size={20} className="text-white" />
        ) : (
          <Image
            src="/images/cimbot.png"
            alt="CimBot"
            width={112}
            height={112}
            className="h-28 w-28 animate-cimbot-wave object-contain drop-shadow-lg"
          />
        )}

        {/* Online dot indicator */}
        {!isOpen && (
          <span className="absolute right-1 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
        )}
      </button>

      {/* Pulse animation (only when closed) */}
      {!isOpen && (
        <span className="absolute bottom-0 right-0 -z-10 h-28 w-28 animate-ping rounded-full bg-primary-600/30" />
      )}
    </div>
  );
}
