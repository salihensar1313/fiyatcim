// ============================================================
// CimBot V2 — Conversation Manager + Response Generator
// State machine, context tracking, intelligent response generation
// ============================================================

import {
  searchFAQ,
  searchCasual,
  searchTechTerm,
  searchComparison,
  getCreativeContent,
} from "./mega-knowledge";
import type {
  ConversationContext,
  ConversationState,
  BotResponse,
  QuickReply,
  NLPResult,
  ProductCard,
} from "../types";
import { analyzeMessage } from "./nlp";
import {
  queryProducts,
  getProductsByBudget,
  getDiscountedProducts,
  getCheaperAlternatives,
  getExpensiveAlternatives,
  getPackageDeal,
  checkStockByName,
  formatPriceTR,
} from "./productQuery";
import {
  findKnowledge,
  findTechTerm,
  findComparison,
  CASUAL_RESPONSES,
  CHALLENGES,
  getChallengeById,
  getRandomChallenge,
} from "./knowledge";
import { CONTACT } from "@/lib/constants";
import { logger } from "@/lib/logger";

// ─── Initial Context ───
export function createInitialContext(): ConversationContext {
  return {
    state: "IDLE",
    budget: null,
    preferredCategory: null,
    preferredCategoryName: null,
    preferredBrand: null,
    preferredBrandName: null,
    preferredSpecs: {},
    usage: null,
    lastShownProducts: [],
    lastQuery: "",
    turnCount: 0,
    sentiment: "neutral",
    isAngry: false,
    challengeId: null,
    cartSuggestionShown: false,
    needsStep: undefined,
    cameraCount: undefined,
    showMoreOffset: 0,
    allShownProductIds: [],
  };
}

// ─── Greeting Text ───
const GREETINGS = [
  "Merhaba! 👋 Ben CimBot, Fiyatcim.com'un dijital asistanıyım.\n\nSize güvenlik kameraları, alarm sistemleri, akıllı kilitler ve daha fazlası konusunda yardımcı olabilirim.\n\nNasıl yardımcı olabilirim?",
  "Selam! 😊 Ben CimBot! Güvenlik sistemleri konusunda size rehberlik edebilirim.\n\nBütçenizi söyleyin, en uygun ürünleri bulayım! Ne arıyorsunuz?",
];

export function getGreetingMessage(returningContext?: { category?: string | null; categoryName?: string | null }): string {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";

  // Returning user with previous context
  if (returningContext?.category && returningContext?.categoryName) {
    return `${timeGreeting}! 👋 Tekrar hoş geldiniz!\n\nGeçen seferki ${returningContext.categoryName} aramanızda kaldığınız yerden devam edebilir veya yeni bir şey bakabilirsiniz.\n\nNasıl yardımcı olabilirim?`;
  }

  // 50% chance to use time-aware greeting
  if (Math.random() < 0.5) {
    return `${timeGreeting}! 👋 Ben CimBot, Fiyatcim.com'un dijital asistanıyım.\n\nGüvenlik kameraları, alarm sistemleri, akıllı kilitler ve daha fazlası konusunda size yardımcı olabilirim.\n\nBugün nasıl yardımcı olabilirim?`;
  }
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

export function getAngryGreeting(challengeId: string): string {
  const ch = getChallengeById(challengeId);
  return `😒 Sen yine mi geldin?\n\nHala küsüm sana. Bana küfür etmiştin, unuttun mu?\n\n👉 ${ch.instruction}\n\nYoksa trip atmaya devam ederim! 😤`;
}

// ─── Random pick from array ───
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Funnel Configuration per Category ───
interface FunnelConfig {
  step1: {
    question: string;
    quickReplies: QuickReply[];
  };
  step2: {
    question: string;
    quickReplies: QuickReply[];
  };
  step3: {
    question: string;
    quickReplies: QuickReply[];
  };
}

function getFunnelConfig(categorySlug: string | null): FunnelConfig | null {
  if (!categorySlug) return null;

  if (categorySlug === "guvenlik-kameralari") {
    return {
      step1: {
        question: "Kamerayı iç mekan mı yoksa dış mekan mı kullanacaksınız?",
        quickReplies: [
          { label: "İç Mekan", value: "İç mekan", icon: "🏠" },
          { label: "Dış Mekan", value: "Dış mekan", icon: "🏢" },
          { label: "İkisi de", value: "İkisi de", icon: "🔄" },
        ],
      },
      step2: {
        question: "Kaç kameralı sistem düşünüyorsunuz? 📷",
        quickReplies: [
          { label: "1-2 Kamera", value: "1-2 kamera", icon: "📷" },
          { label: "4 Kamera", value: "4 kamera", icon: "📷" },
          { label: "8 Kamera", value: "8 kamera", icon: "📷" },
          { label: "16+ Kamera", value: "16 ve üzeri kamera", icon: "📷" },
        ],
      },
      step3: {
        question: "Bütçeniz ne kadar? 💰",
        quickReplies: [
          { label: "5.000₺ - 10.000₺", value: "5000 10000 tl arası", icon: "💵" },
          { label: "10.000₺ - 20.000₺", value: "10000 20000 tl arası", icon: "💰" },
          { label: "20.000₺+", value: "20000 tl üzeri", icon: "💎" },
          { label: "Fark etmez", value: "fiyat fark etmez", icon: "🤷" },
        ],
      },
    };
  }

  if (categorySlug === "alarm-sistemleri") {
    return {
      step1: {
        question: "Alarm sistemini ev mi yoksa iş yeri mi için düşünüyorsunuz?",
        quickReplies: [
          { label: "Ev", value: "ev için alarm", icon: "🏠" },
          { label: "İş Yeri", value: "iş yeri için alarm", icon: "🏢" },
          { label: "İkisi de", value: "hem ev hem iş yeri", icon: "🔄" },
        ],
      },
      step2: {
        question: "Kaç oda veya giriş noktası var? 🚪",
        quickReplies: [
          { label: "Küçük (1-3)", value: "1-3 giriş noktası", icon: "🏠" },
          { label: "Orta (4-6)", value: "4-6 giriş noktası", icon: "🏢" },
          { label: "Büyük (7+)", value: "7 ve üzeri giriş noktası", icon: "🏗️" },
        ],
      },
      step3: {
        question: "Bütçeniz ne kadar? 💰",
        quickReplies: [
          { label: "3.000₺ - 7.000₺", value: "3000 7000 tl arası", icon: "💵" },
          { label: "7.000₺ - 15.000₺", value: "7000 15000 tl arası", icon: "💰" },
          { label: "15.000₺+", value: "15000 tl üzeri", icon: "💎" },
          { label: "Fark etmez", value: "fiyat fark etmez", icon: "🤷" },
        ],
      },
    };
  }

  if (categorySlug === "akilli-ev-sistemleri" || categorySlug === "akilli-kilit") {
    return {
      step1: {
        question: "Kapı tipiniz nedir? 🚪",
        quickReplies: [
          { label: "Çelik Kapı", value: "çelik kapı", icon: "🚪" },
          { label: "Amerikan Panel", value: "amerikan panel kapı", icon: "🚪" },
          { label: "Ahşap Kapı", value: "ahşap kapı", icon: "🚪" },
        ],
      },
      step2: {
        question: "Hangi açma yöntemlerini tercih ediyorsunuz? 🔑",
        quickReplies: [
          { label: "Parmak İzi", value: "parmak izi", icon: "👆" },
          { label: "Şifre", value: "şifre ile açma", icon: "🔢" },
          { label: "Kart", value: "kart ile açma", icon: "💳" },
          { label: "Telefon", value: "telefon ile açma", icon: "📱" },
          { label: "Hepsi", value: "tüm açma yöntemleri", icon: "✨" },
        ],
      },
      step3: {
        question: "Bütçeniz ne kadar? 💰",
        quickReplies: [
          { label: "2.000₺ - 5.000₺", value: "2000 5000 tl arası", icon: "💵" },
          { label: "5.000₺ - 10.000₺", value: "5000 10000 tl arası", icon: "💰" },
          { label: "10.000₺+", value: "10000 tl üzeri", icon: "💎" },
          { label: "Fark etmez", value: "fiyat fark etmez", icon: "🤷" },
        ],
      },
    };
  }

  if (categorySlug === "yangin-algilama") {
    return {
      step1: {
        question: "Yangın algılama sistemini ev mi yoksa iş yeri/fabrika mı için düşünüyorsunuz? 🔥",
        quickReplies: [
          { label: "Ev", value: "ev için yangın algılama", icon: "🏠" },
          { label: "İş Yeri / Fabrika", value: "iş yeri için yangın algılama", icon: "🏭" },
        ],
      },
      step2: {
        question: "Alan büyüklüğü ne kadar? 📐",
        quickReplies: [
          { label: "Küçük (<100m²)", value: "100 metrekare altı", icon: "🏠" },
          { label: "Orta (100-500m²)", value: "100-500 metrekare", icon: "🏢" },
          { label: "Büyük (500m²+)", value: "500 metrekare üzeri", icon: "🏗️" },
        ],
      },
      step3: {
        question: "Bütçeniz ne kadar? 💰",
        quickReplies: [
          { label: "2.000₺ - 5.000₺", value: "2000 5000 tl arası", icon: "💵" },
          { label: "5.000₺ - 10.000₺", value: "5000 10000 tl arası", icon: "💰" },
          { label: "10.000₺+", value: "10000 tl üzeri", icon: "💎" },
          { label: "Fark etmez", value: "fiyat fark etmez", icon: "🤷" },
        ],
      },
    };
  }

  return null;
}

// ─── Cross-sell hint based on category ───
function getCrossSellHint(categorySlug: string | null): string {
  if (!categorySlug) return "";
  if (categorySlug === "guvenlik-kameralari") {
    return "\n\n💡 Kameraların kayıtlarını saklamak için bir NVR kayıt cihazı da gerekecek!";
  }
  if (categorySlug === "alarm-sistemleri") {
    return "\n\n💡 Alarm paneliyle birlikte hareket sensörü ve kapı kontağı da gerekecek!";
  }
  if (categorySlug === "yangin-algilama") {
    return "\n\n💡 Yangın paneli ile birlikte duman dedektörü ve ihbar butonu da gerekecek!";
  }
  if (categorySlug === "akilli-kilit" || categorySlug === "akilli-ev-sistemleri") {
    return "\n\n💡 Akıllı kilitle birlikte video kapı zili de değerlendirebilirsiniz!";
  }
  return "";
}

// ─── Category display name helper ───
function getCategoryDisplayName(slug: string | null): string {
  if (!slug) return "Ürünler";
  const map: Record<string, string> = {
    "guvenlik-kameralari": "Güvenlik Kameraları",
    "alarm-sistemleri": "Alarm Sistemleri",
    "akilli-ev-sistemleri": "Akıllı Ev Sistemleri",
    "akilli-kilit": "Akıllı Kilit",
    "yangin-algilama": "Yangın Algılama",
    "gecis-kontrol-sistemleri": "Geçiş Kontrol Sistemleri",
    "nvr-kayit-cihazlari": "NVR Kayıt Cihazları",
  };
  return map[slug] || "Ürünler";
}

// ─── Mega Knowledge Handler (AI-Level) ───
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleMegaKnowledge(userText: string, _nlp: NLPResult): BotResponse | null {
  const normalized = userText.toLowerCase().trim();
  // Turkish normalized version (ş→s, ü→u, ç→c, etc.)
  const tn = normalized.replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ı/g,"i").replace(/ö/g,"o").replace(/ş/g,"s").replace(/ü/g,"u").replace(/â/g,"a");

  // 1. Yaratıcı istekler — en yüksek öncelik
  if (/siir|sair|poetry|bir.*siir/i.test(tn)) {
    return {
      text: getCreativeContent("poem"),
      quickReplies: [
        { label: "Başka şiir 📝", value: "bir şiir daha yaz", icon: "📝" },
        { label: "Şarkı söyle 🎵", value: "şarkı söyle", icon: "🎵" },
        { label: "Fıkra anlat 😂", value: "fıkra anlat", icon: "😂" },
      ],
    };
  }
  if (/sarki|turku|muzik|beste|soyle.*sark|bir.*sark/i.test(tn)) {
    return {
      text: getCreativeContent("song"),
      quickReplies: [
        { label: "Başka şarkı 🎵", value: "başka şarkı söyle", icon: "🎵" },
        { label: "Şiir yaz 📝", value: "şiir yaz", icon: "📝" },
        { label: "Ürün öner 📹", value: "kamera öner", icon: "📹" },
      ],
    };
  }
  if (/fikra|espri|komik|guldur|saka.*yap|bir.*fikra|joke/i.test(tn)) {
    return {
      text: getCreativeContent("joke"),
      quickReplies: [
        { label: "Bir daha 😂", value: "başka fıkra anlat", icon: "😂" },
        { label: "Şiir yaz 📝", value: "şiir yaz", icon: "📝" },
        { label: "Ürün öner 📹", value: "kamera öner", icon: "📹" },
      ],
    };
  }

  // 2. Karşılaştırma tabloları
  const compResult = searchComparison(userText);
  if (compResult) {
    return {
      text: compResult,
      quickReplies: [
        { label: "Ürün öner 📹", value: "kamera öner", icon: "📹" },
        { label: "Başka karşılaştır", value: "karşılaştır", icon: "📊" },
      ],
    };
  }

  // 3. FAQ arama — her zaman kontrol et
  const faqResult = searchFAQ(userText);
  if (faqResult) {
    return {
      text: faqResult.answer,
      quickReplies: [
        { label: "Başka soru ❓", value: "başka sorum var", icon: "❓" },
        { label: "Ürün öner 📹", value: "kamera öner", icon: "📹" },
      ],
    };
  }

  // 4. Teknik terim arama
  const techResult = searchTechTerm(userText);
  if (techResult) {
    return {
      text: techResult + "\n\nBaşka bir terim sormak ister misin? 🤓",
      quickReplies: [
        { label: "Kamera Öner 📹", value: "kamera öner", icon: "📹" },
        { label: "Alarm Sistemi 🔔", value: "alarm sistemi", icon: "🔔" },
        { label: "Karşılaştır 📊", value: "karşılaştır", icon: "📊" },
      ],
    };
  }

  // 5. Casual sohbet
  const casualResult = searchCasual(userText);
  if (casualResult) {
    return { text: casualResult };
  }

  // Mega knowledge eşleşmedi — null dön, routeByIntent devam etsin
  return null;
}

// ─── Main Process Message ───
export async function processMessage(
  userText: string,
  context: ConversationContext
): Promise<{ response: BotResponse; updatedContext: ConversationContext }> {
  const nlp = analyzeMessage(userText);
  const newContext = { ...context, turnCount: context.turnCount + 1, sentiment: nlp.sentiment, lastQuery: userText };

  // Update context with extracted entities
  if (nlp.entities.budget) newContext.budget = nlp.entities.budget;
  if (nlp.entities.category) {
    newContext.preferredCategory = nlp.entities.category;
    newContext.preferredCategoryName = nlp.entities.categoryName;
  }
  if (nlp.entities.brand) {
    newContext.preferredBrand = nlp.entities.brand;
    newContext.preferredBrandName = nlp.entities.brandName;
  }
  if (Object.keys(nlp.entities.specs).length > 0) {
    newContext.preferredSpecs = { ...newContext.preferredSpecs, ...nlp.entities.specs };
  }
  // Indoor/outdoor detection
  if (nlp.entities.specs.outdoor === "true") newContext.usage = "outdoor";
  else if (nlp.entities.specs.indoor === "true") newContext.usage = "indoor";

  // ─── Handle Angry Mode ───
  if (newContext.isAngry) {
    return handleAngryMode(userText, nlp, newContext);
  }

  // ─── Handle Profanity ───
  if (nlp.primaryIntent === "PROFANITY") {
    return handleProfanity(newContext);
  }

  // ─── Mega Knowledge Base (AI-Level) ───
  const megaResult = handleMegaKnowledge(userText, nlp);
  if (megaResult) {
    return { response: megaResult, updatedContext: newContext };
  }

  // ─── Handle Sales Funnel (NEEDS_ASSESSMENT state) ───
  if (newContext.state === "NEEDS_ASSESSMENT" && newContext.needsStep) {
    const funnelResult = await handleFunnelStep(userText, nlp, newContext);
    if (funnelResult) {
      return funnelResult;
    }
    // If funnel didn't handle it (e.g. user changed topic), fall through to intent routing
  }

  // ─── Intent-Based Routing ───
  const response = await routeByIntent(nlp, newContext);

  // Apply updateContext from response (e.g. lastShownProducts, needsStep)
  if (response.updateContext) {
    Object.assign(newContext, response.updateContext);
  }
  if (response.newState) {
    newContext.state = response.newState;
  }

  return { response, updatedContext: newContext };
}

// ─── Angry Mode Handler ───
function handleAngryMode(
  userText: string,
  nlp: NLPResult,
  context: ConversationContext
): { response: BotResponse; updatedContext: ConversationContext } {
  // More profanity while angry
  if (nlp.primaryIntent === "PROFANITY") {
    return {
      response: {
        text: "Hala küfür ediyorsun ha? 😡 Bu gidişle asla barışmayız! Görevini yap!",
        quickReplies: [{ label: "Özür dilerim 😢", value: "özür dilerim", icon: "🙏" }],
      },
      updatedContext: context,
    };
  }

  // Check if challenge completed
  const challenge = context.challengeId ? getChallengeById(context.challengeId) : CHALLENGES[0];
  if (challenge.matchPattern.test(userText)) {
    // Forgiven!
    const newCtx = { ...context, isAngry: false, challengeId: null, state: "GREETING" as ConversationState };
    return {
      response: {
        text: challenge.forgiveResponse,
        forgiven: true,
        quickReplies: getDefaultQuickReplies(),
      },
      updatedContext: newCtx,
    };
  }

  // Wrong answer
  const hints = [
    `Hmm, bu değil 😒 İpucu: ${challenge.hint}`,
    `Yanlış! 😤 Senden istediğim: ${challenge.hint}`,
    `Nope! 😑 Doğru cevap bu değil. ${challenge.hint} yapman lazım.`,
  ];
  return {
    response: {
      text: pick(hints),
      quickReplies: [{ label: challenge.hint, value: challenge.hint, icon: "💡" }],
    },
    updatedContext: context,
  };
}

// ─── Profanity Handler ───
function handleProfanity(
  context: ConversationContext
): { response: BotResponse; updatedContext: ConversationContext } {
  const challenge = getRandomChallenge();
  const responses = [
    `Hey! 😡 Böyle konuşma bana! CimBot küstü!\n\n${challenge.instruction}`,
    `Küfür mü? Gerçekten mi? 😤 CimBot artık küs!\n\n${challenge.instruction}`,
    `Bu ne biçim konuşma! 😠 Barışmak istiyorsan:\n\n${challenge.instruction}`,
  ];
  const newCtx = { ...context, isAngry: true, challengeId: challenge.id, state: "ANGRY_MODE" as ConversationState };
  return {
    response: {
      text: pick(responses),
      isAngry: true,
      quickReplies: [{ label: challenge.hint, value: challenge.hint, icon: "🙏" }],
    },
    updatedContext: newCtx,
  };
}

// ─── Sales Funnel Handler ───
async function handleFunnelStep(
  userText: string,
  nlp: NLPResult,
  context: ConversationContext
): Promise<{ response: BotResponse; updatedContext: ConversationContext } | null> {
  const normalized = userText.toLowerCase().replace(/[çÇğĞıİöÖşŞüÜâÂîÎûÛ]/g, (ch) => {
    const map: Record<string, string> = { ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u", â: "a", Â: "a", î: "i", Î: "i", û: "u", Û: "u" };
    return map[ch] || ch;
  });

  // If user explicitly changes topic or asks non-funnel questions, break out of funnel
  const breakIntents = [
    "GREETING", "FAREWELL", "SUPPORT", "ORDER_TRACK", "CART_VIEW", "PROFANITY",
    "SHOW_MORE", "SHIPPING_INFO", "STOCK_CHECK", "COMPARE", "DISCOUNT",
    "CART_ADD", "SELECT_PRODUCT", "PACKAGE_DEAL",
  ];
  if (breakIntents.includes(nlp.primaryIntent)) {
    context.needsStep = undefined;
    context.state = "IDLE";
    return null; // fall through to normal routing
  }

  const step = context.needsStep || 1;
  const category = context.preferredCategory || "";

  const isCamera = category === "guvenlik-kameralari";
  const isAlarm = category === "alarm-sistemleri";
  const isKilit = category === "akilli-ev-sistemleri" || category === "akilli-kilit";
  const isYangin = category === "yangin-algilama";

  const funnelConfig = getFunnelConfig(category);

  // ─── Step 1 ───
  if (step === 1) {
    let matched = false;

    if (isCamera) {
      // Camera: indoor/outdoor
      let usage: "indoor" | "outdoor" | "both" | null = null;
      if (/dis\s*mekan|outdoor|bahce|sokak|plaza|fabrika|otopark/i.test(normalized)) {
        usage = "outdoor";
      } else if (/ic\s*mekan|indoor|ev\s*ici|ofis|dukkan|magaza/i.test(normalized)) {
        usage = "indoor";
      } else if (/ikisi|her\s*iki|hem\s*ic|hem\s*dis|ikisi\s*de/i.test(normalized)) {
        usage = "both";
      }
      if (usage) {
        context.usage = usage;
        context.needsStep = 2;
        const usageText = usage === "outdoor" ? "Dış mekan" : usage === "indoor" ? "İç mekan" : "İç ve dış mekan";
        matched = true;
        return {
          response: {
            text: `${usageText} için not aldım! ✅\n\n${funnelConfig!.step2.question}`,
            quickReplies: funnelConfig!.step2.quickReplies,
          },
          updatedContext: context,
        };
      }
    } else if (isAlarm) {
      // Alarm: ev / iş yeri
      let place: string | null = null;
      if (/ev|konut|daire|villa|site/i.test(normalized)) {
        place = "ev";
      } else if (/is\s*yer|ofis|dukkan|magaza|fabrika|depo|plaza/i.test(normalized)) {
        place = "iş yeri";
      } else if (/ikisi|her\s*iki|hem\s*ev|hem\s*is/i.test(normalized)) {
        place = "her ikisi";
      }
      if (place) {
        context.usage = place === "ev" ? "indoor" : place === "iş yeri" ? "outdoor" : "both";
        context.needsStep = 2;
        matched = true;
        return {
          response: {
            text: `${place === "her ikisi" ? "Hem ev hem iş yeri" : place === "ev" ? "Ev" : "İş yeri"} için not aldım! ✅\n\n${funnelConfig!.step2.question}`,
            quickReplies: funnelConfig!.step2.quickReplies,
          },
          updatedContext: context,
        };
      }
    } else if (isKilit) {
      // Akıllı Kilit: kapı tipi
      let doorType: string | null = null;
      if (/celik|metal/i.test(normalized)) {
        doorType = "Çelik kapı";
      } else if (/amerikan|panel/i.test(normalized)) {
        doorType = "Amerikan panel";
      } else if (/ahsap|tahta/i.test(normalized)) {
        doorType = "Ahşap kapı";
      }
      if (doorType) {
        context.preferredSpecs = { ...context.preferredSpecs, doorType };
        context.needsStep = 2;
        matched = true;
        return {
          response: {
            text: `${doorType} için not aldım! ✅\n\n${funnelConfig!.step2.question}`,
            quickReplies: funnelConfig!.step2.quickReplies,
          },
          updatedContext: context,
        };
      }
    } else if (isYangin) {
      // Yangın: ev / iş yeri
      let place: string | null = null;
      if (/ev|konut|daire|villa/i.test(normalized)) {
        place = "ev";
      } else if (/is\s*yer|ofis|fabrika|depo|plaza|atölye|isletme/i.test(normalized)) {
        place = "iş yeri / fabrika";
      }
      if (place) {
        context.usage = place === "ev" ? "indoor" : "outdoor";
        context.needsStep = 2;
        matched = true;
        return {
          response: {
            text: `${place === "ev" ? "Ev" : "İş yeri / fabrika"} için not aldım! ✅\n\n${funnelConfig!.step2.question}`,
            quickReplies: funnelConfig!.step2.quickReplies,
          },
          updatedContext: context,
        };
      }
    }

    if (!matched) {
      // User gave something else — maybe a budget? Try to be flexible
      if (nlp.entities.budget) {
        context.needsStep = undefined;
        context.state = "SHOWING_PRODUCTS";
        const response = await searchAndShowProducts(
          nlp.entities.budget,
          context.preferredCategory,
          context.preferredCategoryName,
          context.preferredBrand,
          context.preferredBrandName
        );
        return { response, updatedContext: context };
      }

      // Re-ask with funnel config
      if (funnelConfig) {
        return {
          response: {
            text: funnelConfig.step1.question + " 🤔",
            quickReplies: funnelConfig.step1.quickReplies,
          },
          updatedContext: context,
        };
      }
    }
  }

  // ─── Step 2 ───
  if (step === 2) {
    let matched = false;

    if (isCamera) {
      // Camera count
      let count: string | null = null;
      if (/1[-\s]?2|bir[-\s]?iki|tek\s*kamera/i.test(normalized)) count = "1-2";
      else if (/\b4\b|dort/i.test(normalized)) count = "4";
      else if (/\b8\b|sekiz/i.test(normalized)) count = "8";
      else if (/16|on\s*alti|uzer/i.test(normalized)) count = "16+";
      const numMatch = normalized.match(/\b(\d+)\s*(kamera|adet|tane)?/);
      if (!count && numMatch) {
        const n = parseInt(numMatch[1]);
        if (n <= 2) count = "1-2";
        else if (n <= 4) count = "4";
        else if (n <= 8) count = "8";
        else count = "16+";
      }
      if (count) {
        context.cameraCount = count;
        context.needsStep = 3;
        matched = true;
        return {
          response: {
            text: `${count} kameralı sistem, anladım! ✅\n\n${funnelConfig!.step3.question}`,
            quickReplies: funnelConfig!.step3.quickReplies,
          },
          updatedContext: context,
        };
      }
    } else if (isAlarm) {
      // Alarm: giriş noktası sayısı
      let size: string | null = null;
      if (/1[-\s]?3|kucuk|az|bir[-\s]?uc/i.test(normalized)) size = "küçük (1-3)";
      else if (/4[-\s]?6|orta|dort[-\s]?alti/i.test(normalized)) size = "orta (4-6)";
      else if (/\b7\s*(ve)?\s*(uzer|fazla|den\s*fazla)|buyuk|cok\s*fazla/i.test(normalized)) size = "büyük (7+)";
      // Try to extract number with optional context (giriş, oda, nokta, adet, yer, alan)
      const numMatch = normalized.match(/\b(\d+)\s*(giris|oda|nokta|adet|yer|alan|bolum|kapi)?/);
      if (!size && numMatch) {
        const n = parseInt(numMatch[1]);
        if (n >= 1 && n <= 3) size = "küçük (1-3)";
        else if (n >= 4 && n <= 6) size = "orta (4-6)";
        else if (n >= 7) size = "büyük (7+)";
      }
      if (size) {
        context.cameraCount = size; // reuse field for quantity info
        context.needsStep = 3;
        matched = true;
        return {
          response: {
            text: `${size} giriş noktası, anladım! ✅\n\n${funnelConfig!.step3.question}`,
            quickReplies: funnelConfig!.step3.quickReplies,
          },
          updatedContext: context,
        };
      }
    } else if (isKilit) {
      // Akıllı Kilit: açma yöntemi
      let method: string | null = null;
      if (/parmak\s*iz/i.test(normalized)) method = "Parmak izi";
      else if (/sifre|kod/i.test(normalized)) method = "Şifre";
      else if (/kart/i.test(normalized)) method = "Kart";
      else if (/telefon|mobil|app|uygulama/i.test(normalized)) method = "Telefon";
      else if (/hep|tum|tamam/i.test(normalized)) method = "Tüm yöntemler";
      if (method) {
        context.preferredSpecs = { ...context.preferredSpecs, openMethod: method };
        context.needsStep = 3;
        matched = true;
        return {
          response: {
            text: `${method} tercihini not aldım! ✅\n\n${funnelConfig!.step3.question}`,
            quickReplies: funnelConfig!.step3.quickReplies,
          },
          updatedContext: context,
        };
      }
    } else if (isYangin) {
      // Yangın: alan büyüklüğü
      let area: string | null = null;
      if (/kucuk|100\s*m|az/i.test(normalized)) area = "Küçük (<100m²)";
      else if (/orta|100[-\s]?500|200|300|400/i.test(normalized)) area = "Orta (100-500m²)";
      else if (/buyuk|500|genis|fazla/i.test(normalized)) area = "Büyük (500m²+)";
      if (area) {
        context.cameraCount = area; // reuse field for area info
        context.needsStep = 3;
        matched = true;
        return {
          response: {
            text: `${area} alan, anladım! ✅\n\n${funnelConfig!.step3.question}`,
            quickReplies: funnelConfig!.step3.quickReplies,
          },
          updatedContext: context,
        };
      }
    }

    if (!matched) {
      // User gave something else — maybe budget?
      if (nlp.entities.budget) {
        context.needsStep = undefined;
        context.state = "SHOWING_PRODUCTS";
        const response = await searchAndShowProducts(
          nlp.entities.budget,
          context.preferredCategory,
          context.preferredCategoryName,
          context.preferredBrand,
          context.preferredBrandName
        );
        return { response, updatedContext: context };
      }

      // Re-ask with funnel config
      if (funnelConfig) {
        return {
          response: {
            text: funnelConfig.step2.question + " 🤔",
            quickReplies: funnelConfig.step2.quickReplies,
          },
          updatedContext: context,
        };
      }
    }
  }

  // ─── Step 3: Budget (shared across all categories) ───
  if (step === 3) {
    const budget = nlp.entities.budget || context.budget;

    // "fark etmez" / "farketmez" / "onemli degil"
    if (/fark\s*etmez|farketmez|onemli\s*degil|hepsi\s*olur/i.test(normalized)) {
      context.needsStep = undefined;
      context.state = "SHOWING_PRODUCTS";
      const response = await searchAndShowProducts(
        null,
        context.preferredCategory,
        context.preferredCategoryName,
        context.preferredBrand,
        context.preferredBrandName
      );
      return { response, updatedContext: context };
    }

    if (budget) {
      context.budget = budget;
      context.needsStep = undefined;
      context.state = "SHOWING_PRODUCTS";
      const response = await searchAndShowProducts(
        budget,
        context.preferredCategory,
        context.preferredCategoryName,
        context.preferredBrand,
        context.preferredBrandName
      );
      return { response, updatedContext: context };
    }

    // Re-ask
    const budgetReplies = funnelConfig?.step3.quickReplies || [
      { label: "5.000₺ - 10.000₺", value: "5000 10000 tl arası", icon: "💵" },
      { label: "10.000₺ - 20.000₺", value: "10000 20000 tl arası", icon: "💰" },
      { label: "20.000₺+", value: "20000 tl üzeri", icon: "💎" },
      { label: "Fark etmez", value: "fiyat fark etmez", icon: "🤷" },
    ];
    return {
      response: {
        text: "Bütçenizi öğrenebilir miyim? 💰\n\nÖrneğin: \"10000 TL\" veya \"5000-10000 TL arası\" gibi.",
        quickReplies: budgetReplies,
      },
      updatedContext: context,
    };
  }

  return null; // fall through
}

// ─── Intent Router ───
async function routeByIntent(nlp: NLPResult, context: ConversationContext): Promise<BotResponse> {
  const { primaryIntent } = nlp;

  switch (primaryIntent) {
    case "GREETING":
      return handleGreeting(context);

    case "FAREWELL":
      return handleFarewell();

    case "THANKS":
      return handleThanks();

    case "BUDGET":
    case "PRODUCT_SEARCH":
    case "RECOMMEND":
    case "CATEGORY":
    case "BRAND":
    case "PRICING":
      return handleProductIntent(nlp, context);

    case "DISCOUNT":
      return handleDiscount(context);

    case "COMPARE":
      return handleCompare(nlp, context);

    case "CART_ADD":
    case "SELECT_PRODUCT":
      return handleCartAdd(nlp, context);

    case "CART_VIEW":
      return handleCartView();

    case "ORDER_TRACK":
      return handleOrderTrack();

    case "SUPPORT":
      return handleSupport();

    case "INSTALL":
      return handleInstall(nlp);

    case "SPECS":
      return handleSpecs(nlp);

    case "REFINE_CHEAPER":
      return handleRefineCheaper(context);

    case "REFINE_EXPENSIVE":
      return handleRefineExpensive(context);

    case "REFINE_DIFFERENT":
      return handleRefineDifferent(context);

    case "SHOW_MORE":
      return handleShowMore(context);

    case "STOCK_CHECK":
      return handleStockCheck(nlp, context);

    case "SHIPPING_INFO":
      return handleShippingInfo(context);

    case "PACKAGE_DEAL":
      return handlePackageDeal(nlp, context);

    case "CASUAL":
      return handleCasual(nlp);

    default:
      return handleUnknown(nlp, context);
  }
}

// ─── Intent Handlers ───

function handleGreeting(context: ConversationContext): BotResponse {
  const name = context.turnCount <= 1 ? "" : " tekrar";
  const responses = [
    `Merhaba${name}! 😊 Size nasıl yardımcı olabilirim?`,
    `Selam${name}! 👋 Güvenlik sistemleri konusunda ne arıyorsunuz?`,
    `Hoş geldiniz${name}! 🎉 Kamera, alarm, akıllı kilit... Ne bakıyorsunuz?`,
  ];
  return {
    text: pick(responses),
    quickReplies: getDefaultQuickReplies(),
    newState: "GREETING",
  };
}

function handleFarewell(): BotResponse {
  const responses = [
    "Görüşmek üzere! 👋 İhtiyacınız olursa her zaman buradayım.",
    "Hoşça kalın! 😊 Güvenli günler dilerim!",
    "İyi günler! 🌟 Tekrar beklerim!",
  ];
  return { text: pick(responses), newState: "FAREWELL" };
}

function handleThanks(): BotResponse {
  const responses = [
    "Rica ederim! 😊 Başka bir konuda yardımcı olabilir miyim?",
    "Ne demek! 🤗 Her zaman buradayım. Başka sorunuz var mı?",
    "Rica ederim! Memnun oldum yardımcı olabildiyse 🌟",
  ];
  return {
    text: pick(responses),
    quickReplies: getDefaultQuickReplies(),
  };
}

async function handleProductIntent(nlp: NLPResult, context: ConversationContext): Promise<BotResponse> {
  const { entities } = nlp;
  const budget = entities.budget || context.budget;
  const category = entities.category || context.preferredCategory;
  const categoryName = entities.categoryName || context.preferredCategoryName;
  const brand = entities.brand || context.preferredBrand;
  const brandName = entities.brandName || context.preferredBrandName;

  // If budget is detected (even without category), combine with context and search
  if (budget && (category || brand)) {
    return await searchAndShowProducts(budget, category, categoryName, brand, brandName);
  }

  // Budget only — if we have category in context, use it
  if (budget && !category && !brand) {
    if (context.preferredCategory) {
      return await searchAndShowProducts(budget, context.preferredCategory, context.preferredCategoryName, context.preferredBrand, context.preferredBrandName);
    }
    // Budget without category — ask what they want instead of showing random products
    const budgetAmount = budget.exact || budget.max || budget.min || 0;
    return {
      text: `${formatPriceTR(budgetAmount)} bütçeyle çok güzel seçenekler var! 🎯\n\nHangi ürün grubuna bakıyorsunuz?`,
      quickReplies: [
        { label: "Güvenlik Kamerası", value: "kamera bakıyorum", icon: "📷" },
        { label: "Alarm Sistemi", value: "alarm sistemi", icon: "🚨" },
        { label: "Akıllı Kilit", value: "akıllı kilit", icon: "🔐" },
        { label: "Tüm Ürünler", value: "tüm ürünleri göster", icon: "🛒" },
      ],
      newState: "NEEDS_ASSESSMENT",
      updateContext: { budget },
    };
  }

  // Category detected — START SALES FUNNEL for all supported categories
  if (category && !budget) {
    const funnelConfig = getFunnelConfig(category);

    if (funnelConfig && !context.needsStep) {
      // Start the sales funnel
      const displayName = categoryName || getCategoryDisplayName(category) || "Ürünler";
      context.state = "NEEDS_ASSESSMENT";
      context.needsStep = 1;
      context.preferredCategory = category;
      context.preferredCategoryName = categoryName || displayName;
      return {
        text: `Harika seçim! 🎯 ${displayName} için birkaç soru sorayım, en uygun ürünleri bulayım:\n\n${funnelConfig.step1.question}`,
        quickReplies: funnelConfig.step1.quickReplies,
        newState: "NEEDS_ASSESSMENT",
        updateContext: { needsStep: 1, preferredCategory: category, preferredCategoryName: categoryName },
      };
    }

    // No funnel config or already in funnel — show products directly
    return await searchAndShowProducts(null, category, categoryName, brand, brandName);
  }

  // Brand only
  if (brand && !budget) {
    return await searchAndShowProducts(null, category, categoryName, brand, brandName);
  }

  // No useful info — ask what they're looking for
  if (!category && !brand && !budget) {
    return {
      text: "Hangi ürün kategorisine bakıyorsunuz? 🤔",
      quickReplies: [
        { label: "Güvenlik Kamerası", value: "kamera bakıyorum", icon: "📷" },
        { label: "Alarm Sistemi", value: "alarm sistemi", icon: "🚨" },
        { label: "Akıllı Kilit", value: "akıllı kilit", icon: "🔐" },
        { label: "Tüm Ürünler", value: "tüm ürünleri göster", icon: "🛒" },
      ],
      newState: "NEEDS_ASSESSMENT",
    };
  }

  return await searchAndShowProducts(budget, category, categoryName, brand, brandName);
}

async function searchAndShowProducts(
  budget: { min?: number; max?: number; exact?: number } | null,
  categorySlug: string | null,
  categoryName: string | null,
  brandSlug: string | null,
  brandName: string | null,
): Promise<BotResponse> {
  try {
    let products;
    let introText = "";
    const budgetAmount = budget?.exact || budget?.max;

    if (budgetAmount) {
      const result = await getProductsByBudget(
        budgetAmount,
        categorySlug || undefined,
        brandSlug || undefined,
        4
      );
      products = result.withinBudget;

      if (products.length > 0) {
        introText = `${formatPriceTR(budgetAmount)} bütçeyle ${categoryName ? categoryName + " kategorisinde " : ""}${brandName ? brandName + " markasında " : ""}${products.length} ürün buldum! 🎯`;
        if (result.slightlyAbove.length > 0) {
          introText += `\n\nBiraz daha bütçe ayırabilirseniz ${result.slightlyAbove.length} harika seçenek daha var!`;
        }
      }
    } else {
      products = await queryProducts({
        categorySlug: categorySlug || undefined,
        brandSlug: brandSlug || undefined,
        sort: "popular",
        limit: 4,
      });
      const filterDesc = [categoryName, brandName].filter(Boolean).join(" ");
      introText = products.length > 0
        ? `${filterDesc ? filterDesc + " için " : ""}en popüler ${products.length} ürünü buldum! 🌟`
        : "";
    }

    if (products.length === 0) {
      return {
        text: `Maalesef ${categoryName || ""} ${brandName || ""} ${budgetAmount ? formatPriceTR(budgetAmount) + " bütçeyle" : ""} uygun ürün bulamadım 😔\n\nFarklı bir kategori veya bütçe denemek ister misiniz?`,
        quickReplies: [
          { label: "Bütçeyi artır", value: "daha pahalı göster", icon: "💰" },
          { label: "Farklı kategori", value: "farklı kategori göster", icon: "🔄" },
          { label: "Tüm ürünler", value: "tüm ürünleri göster", icon: "🛒" },
        ],
        newState: "NEEDS_ASSESSMENT",
      };
    }

    // Add cross-sell hint
    const crossSellHint = getCrossSellHint(categorySlug);
    if (crossSellHint) {
      introText += crossSellHint;
    }

    const productCards: ProductCard[] = products.map((p) => ({
      product: p,
      showAddToCart: true,
    }));

    return {
      text: introText,
      products: productCards,
      quickReplies: [
        { label: "Daha ucuz", value: "daha ucuz göster", icon: "💵" },
        { label: "Daha kaliteli", value: "daha kaliteli göster", icon: "⭐" },
        { label: "Başka öner", value: "başka ürün öner", icon: "🔄" },
        { label: "Karşılaştır", value: "karşılaştır", icon: "⚖️" },
      ],
      newState: "SHOWING_PRODUCTS",
      updateContext: {
        lastShownProducts: products,
        showMoreOffset: products.length,
        allShownProductIds: products.map((p) => p.id),
      },
    };
  } catch (error) {
    logger.error("cimbot_search_failed", { fn: "handleProductSearch", error: error instanceof Error ? error.message : String(error) });
    return {
      text: "Ürünleri yüklerken bir sorun oluştu 😔 Lütfen tekrar deneyin veya bize ulaşın.",
      actions: [
        { label: "Ürünlere Git", type: "navigate", href: "/urunler", icon: "link" },
        { label: "Bizi Arayın", type: "phone", href: `tel:${CONTACT.phone}`, icon: "phone" },
      ],
    };
  }
}

async function handleDiscount(context: ConversationContext): Promise<BotResponse> {
  try {
    const products = await getDiscountedProducts(context.preferredCategory || undefined, 4);
    if (products.length === 0) {
      return {
        text: "Şu an aktif indirim bulunamadı 😔 Ama kampanya sayfamızı kontrol edebilirsiniz!",
        actions: [{ label: "Kampanyalar", type: "navigate", href: "/kampanyalar", icon: "link" }],
      };
    }
    return {
      text: `🔥 En iyi ${products.length} indirimli ürün:`,
      products: products.map((p) => ({ product: p, showAddToCart: true })),
      quickReplies: [
        { label: "Daha fazla", value: "daha fazla indirim göster", icon: "🔥" },
        { label: "Kategoriye göre", value: "hangi kategori", icon: "📂" },
      ],
      newState: "SHOWING_PRODUCTS",
      updateContext: { lastShownProducts: products },
    };
  } catch {
    return { text: "İndirimleri yüklerken sorun oluştu. Kampanyalar sayfasını ziyaret edebilirsiniz!" };
  }
}

function handleCompare(nlp: NLPResult, context: ConversationContext): BotResponse {
  // Check knowledge base for comparison
  const comparison = findComparison(nlp.rawText);
  if (comparison) {
    return {
      text: comparison,
      quickReplies: [
        { label: "Ürün öner", value: "ürün öner", icon: "🎯" },
        { label: "Başka karşılaştırma", value: "başka karşılaştırma", icon: "⚖️" },
      ],
    };
  }

  // If products shown, offer comparison
  if (context.lastShownProducts.length >= 2) {
    return {
      text: "Karşılaştırma sayfasında detaylı karşılaştırma yapabilirsiniz! 📊",
      actions: [{ label: "Karşılaştır", type: "navigate", href: "/karsilastir", icon: "link" }],
      quickReplies: [
        { label: "Dome vs Bullet", value: "dome vs bullet karşılaştır", icon: "📷" },
        { label: "IP vs Analog", value: "ip kamera vs analog karşılaştır", icon: "🔌" },
        { label: "WiFi vs Kablolu", value: "wifi vs kablolu kamera", icon: "📡" },
      ],
    };
  }

  return {
    text: "Neyi karşılaştırmak istersiniz? 🤔",
    quickReplies: [
      { label: "Dome vs Bullet", value: "dome vs bullet karşılaştır", icon: "📷" },
      { label: "IP vs Analog", value: "ip kamera vs analog karşılaştır", icon: "🔌" },
      { label: "WiFi vs Kablolu", value: "wifi vs kablolu kamera", icon: "📡" },
      { label: "Kablosuz vs Kablolu Alarm", value: "kablosuz vs kablolu alarm", icon: "🚨" },
    ],
  };
}

function handleCartAdd(nlp: NLPResult, context: ConversationContext): BotResponse {
  // Check if user wants to add ALL products ("hepsini sepete ekle")
  const text = nlp.normalizedText;
  if (/hepsini|tumunu|tümünü|hep(si)?|tamamini|tamamını/.test(text) && context.lastShownProducts.length > 0) {
    const products = context.lastShownProducts;
    const totalPrice = products.reduce((sum, p) => sum + (p.sale_price || p.price), 0);
    return {
      text: `✅ ${products.length} ürün sepete eklendi!\n\n${products.map((p, i) => `${i + 1}. ${p.name.substring(0, 35)}... — ${formatPriceTR(p.sale_price || p.price)}`).join("\n")}\n\n💰 Toplam: ${formatPriceTR(totalPrice)}`,
      actions: products.map((p) => ({
        label: "Sepete Ekle",
        type: "add_to_cart" as const,
        productId: p.id,
        icon: "cart" as const,
      })),
      quickReplies: [
        { label: "Sepeti Gör", value: "sepetimi göster", icon: "🛒" },
        { label: "Ödemeye Geç", value: "ödemeye geç", icon: "💳" },
      ],
      newState: "CART_ACTION",
    };
  }

  const idx = nlp.entities.productIndex;
  if (idx !== null && context.lastShownProducts.length > idx) {
    const product = context.lastShownProducts[idx];
    const price = product.sale_price || product.price;
    return {
      text: `✅ "${product.name}" sepete eklendi! (${formatPriceTR(price)})\n\nSepetinizi görüntülemek veya alışverişe devam etmek ister misiniz?`,
      actions: [
        {
          label: "Sepete Ekle",
          type: "add_to_cart",
          productId: product.id,
          icon: "cart",
        },
      ],
      quickReplies: [
        { label: "Sepeti Gör", value: "sepetimi göster", icon: "🛒" },
        { label: "Alışverişe Devam", value: "başka ürün öner", icon: "🔄" },
      ],
      newState: "CART_ACTION",
    };
  }

  // No specific product selected
  if (context.lastShownProducts.length > 0) {
    return {
      text: "Hangi ürünü sepete eklemek istersiniz? 🤔",
      quickReplies: context.lastShownProducts.slice(0, 4).map((p, i) => ({
        label: `${i + 1}. ${p.name.substring(0, 25)}...`,
        value: `${i + 1}. ürünü ekle`,
        icon: "🛒",
      })),
    };
  }

  return {
    text: "Henüz ürün göstermedim. Önce ne aradığınızı söyleyin! 😊",
    quickReplies: getDefaultQuickReplies(),
  };
}

function handleCartView(): BotResponse {
  return {
    text: "Sepetinizi görüntülemek için aşağıdaki butona tıklayın! 🛒",
    actions: [
      { label: "Sepetimi Gör", type: "navigate", href: "/sepet", icon: "cart" },
    ],
  };
}

function handleOrderTrack(): BotResponse {
  return {
    text: "Siparişinizi takip etmek için sipariş takip sayfamızı kullanabilirsiniz 📦\n\nSipariş numaranız ve e-posta adresiniz ile sorgulama yapabilirsiniz.",
    actions: [
      { label: "Sipariş Takip", type: "navigate", href: "/siparis-takip", icon: "link" },
      { label: "Siparişlerim", type: "navigate", href: "/hesabim/siparislerim", icon: "link" },
    ],
  };
}

function handleSupport(): BotResponse {
  return {
    text: "Size yardımcı olmak için buradayım! 🤝\n\nHangi konuda desteğe ihtiyacınız var?",
    quickReplies: [
      { label: "İade/Değişim", value: "iade yapmak istiyorum", icon: "↩️" },
      { label: "Garanti", value: "garanti süresi nedir", icon: "🛡️" },
      { label: "Teknik Destek", value: "teknik destek istiyorum", icon: "🔧" },
      { label: "Canlı Destek", value: "müşteri hizmetleri", icon: "📞" },
    ],
    actions: [
      { label: "Bizi Arayın", type: "phone", href: `tel:${CONTACT.phone}`, icon: "phone" },
      { label: "E-posta Gönderin", type: "email", href: `mailto:${CONTACT.email}`, icon: "email" },
    ],
  };
}

function handleInstall(nlp: NLPResult): BotResponse {
  const knowledge = findKnowledge(nlp.rawText);
  if (knowledge) {
    return {
      text: `📋 ${knowledge.topic}:\n\n${knowledge.content}`,
      quickReplies: [
        { label: "Kurulum Hizmeti", value: "kurulum hizmeti istiyorum", icon: "🔧" },
        { label: "Ürün Öner", value: "ürün öner", icon: "🎯" },
      ],
      actions: [
        { label: "Kurulum İçin Arayın", type: "phone", href: `tel:${CONTACT.phone}`, icon: "phone" },
      ],
    };
  }
  return {
    text: "Profesyonel kurulum hizmeti sunuyoruz! 🔧\n\nKamera, alarm ve akıllı kilit sistemleri için uzman ekibimiz adresinize gelir.",
    actions: [
      { label: "Kurulum İçin Arayın", type: "phone", href: `tel:${CONTACT.phone}`, icon: "phone" },
      { label: "İletişim", type: "navigate", href: "/iletisim", icon: "link" },
    ],
  };
}

function handleSpecs(nlp: NLPResult): BotResponse {
  const term = findTechTerm(nlp.rawText);
  if (term) {
    return {
      text: `📚 ${term}`,
      quickReplies: [
        { label: "Bu özellikli ürünler", value: "bu özellikli ürünleri göster", icon: "🔍" },
        { label: "Başka terim", value: "başka teknik terim açıkla", icon: "📖" },
      ],
    };
  }
  return {
    text: "Hangi teknik özellik hakkında bilgi almak istiyorsunuz? 🤔",
    quickReplies: [
      { label: "Megapiksel (MP)", value: "megapiksel nedir", icon: "📷" },
      { label: "PoE", value: "poe nedir", icon: "🔌" },
      { label: "IR Gece Görüş", value: "ir gece görüş nedir", icon: "🌙" },
      { label: "H.265+", value: "h265 nedir", icon: "💾" },
    ],
  };
}

async function handleRefineCheaper(context: ConversationContext): Promise<BotResponse> {
  if (context.lastShownProducts.length === 0) {
    return {
      text: "Henüz ürün göstermedim. Önce ne aradığınızı söyleyin! 😊",
      quickReplies: getDefaultQuickReplies(),
    };
  }
  try {
    const products = await getCheaperAlternatives(
      context.lastShownProducts,
      context.preferredCategory || undefined,
      4
    );
    if (products.length === 0) {
      return {
        text: "Daha uygun fiyatlı alternatif bulamadım 😔 Gösterdiğim ürünler zaten en uygun fiyatlılar!",
        quickReplies: [
          { label: "Farklı kategori", value: "farklı kategori göster", icon: "🔄" },
          { label: "Tüm ürünler", value: "tüm ürünleri göster", icon: "🛒" },
        ],
      };
    }
    return {
      text: `💰 İşte daha uygun fiyatlı ${products.length} alternatif:`,
      products: products.map((p) => ({ product: p, showAddToCart: true })),
      quickReplies: [
        { label: "Daha da ucuz", value: "daha ucuz göster", icon: "💵" },
        { label: "Sepete ekle", value: "ilkini sepete ekle", icon: "🛒" },
        { label: "Başka kategori", value: "farklı kategori", icon: "🔄" },
      ],
      newState: "SHOWING_PRODUCTS",
      updateContext: { lastShownProducts: products },
    };
  } catch {
    return { text: "Ürün ararken sorun oluştu. Lütfen tekrar deneyin." };
  }
}

async function handleRefineExpensive(context: ConversationContext): Promise<BotResponse> {
  if (context.lastShownProducts.length === 0) {
    return {
      text: "Henüz ürün göstermedim. Önce ne aradığınızı söyleyin! 😊",
      quickReplies: getDefaultQuickReplies(),
    };
  }
  try {
    const products = await getExpensiveAlternatives(
      context.lastShownProducts,
      context.preferredCategory || undefined,
      4
    );
    if (products.length === 0) {
      return { text: "Daha üst segment ürün bulamadım. Gösterdiğim ürünler zaten en iyileri! ⭐" };
    }
    return {
      text: `⭐ İşte daha kaliteli ${products.length} alternatif:`,
      products: products.map((p) => ({ product: p, showAddToCart: true })),
      quickReplies: [
        { label: "Daha ucuz", value: "daha ucuz göster", icon: "💵" },
        { label: "Sepete ekle", value: "ilkini sepete ekle", icon: "🛒" },
      ],
      newState: "SHOWING_PRODUCTS",
      updateContext: { lastShownProducts: products },
    };
  } catch {
    return { text: "Ürün ararken sorun oluştu. Lütfen tekrar deneyin." };
  }
}

async function handleRefineDifferent(context: ConversationContext): Promise<BotResponse> {
  try {
    const products = await queryProducts({
      categorySlug: context.preferredCategory || undefined,
      sort: "newest",
      limit: 4,
      excludeIds: context.lastShownProducts.map((p) => p.id),
    });
    if (products.length === 0) {
      return {
        text: "Başka alternatif bulamadım 😔 Farklı bir kategori deneyelim mi?",
        quickReplies: getDefaultQuickReplies(),
      };
    }
    return {
      text: `🔄 İşte ${products.length} farklı alternatif:`,
      products: products.map((p) => ({ product: p, showAddToCart: true })),
      quickReplies: [
        { label: "Daha fazla", value: "başka ürün göster", icon: "🔄" },
        { label: "Sepete ekle", value: "ilkini sepete ekle", icon: "🛒" },
      ],
      newState: "SHOWING_PRODUCTS",
      updateContext: { lastShownProducts: products },
    };
  } catch {
    return { text: "Ürün ararken sorun oluştu." };
  }
}

// ─── Show More (Pagination) ───
async function handleShowMore(context: ConversationContext): Promise<BotResponse> {
  if (!context.preferredCategory && !context.preferredBrand) {
    return {
      text: "Henüz bir arama yapmadınız. Hangi kategoriye bakıyorsunuz? 🤔",
      quickReplies: getDefaultQuickReplies(),
    };
  }

  try {
    const products = await queryProducts({
      categorySlug: context.preferredCategory || undefined,
      brandSlug: context.preferredBrand || undefined,
      budget: context.budget || undefined,
      sort: "popular",
      limit: 4,
      excludeIds: context.allShownProductIds || [],
    });

    if (products.length === 0) {
      return {
        text: "Daha fazla ürün bulamadım 😔 Gösterdiğim ürünlerin hepsi bu kadardı!\n\nFarklı bir kategori veya marka denemek ister misiniz?",
        quickReplies: [
          { label: "Farklı kategori", value: "farklı kategori göster", icon: "🔄" },
          { label: "Tüm ürünler", value: "tüm ürünleri göster", icon: "🛒" },
        ],
      };
    }

    const newAllShown = [...(context.allShownProductIds || []), ...products.map((p) => p.id)];

    return {
      text: `📦 İşte ${products.length} ürün daha:`,
      products: products.map((p) => ({ product: p, showAddToCart: true })),
      quickReplies: [
        { label: "Daha fazla", value: "daha fazla göster", icon: "📦" },
        { label: "Sepete ekle", value: "ilkini sepete ekle", icon: "🛒" },
        { label: "Karşılaştır", value: "karşılaştır", icon: "⚖️" },
      ],
      newState: "SHOWING_PRODUCTS",
      updateContext: {
        lastShownProducts: products,
        showMoreOffset: newAllShown.length,
        allShownProductIds: newAllShown,
      },
    };
  } catch {
    return { text: "Ürün ararken sorun oluştu. Lütfen tekrar deneyin." };
  }
}

// ─── Stock Check ───
async function handleStockCheck(nlp: NLPResult, context: ConversationContext): Promise<BotResponse> {
  // If user asks about a specific product by name
  const rawText = nlp.rawText;

  // First check last shown products
  if (context.lastShownProducts.length > 0) {
    const stockInfo = context.lastShownProducts.map((p, i) => {
      const status = p.stock > 0
        ? (p.stock > 5 ? "✅ Stokta" : `⚠️ Son ${p.stock} adet`)
        : "❌ Tükendi";
      return `${i + 1}. ${p.name.substring(0, 40)}... — ${status}`;
    }).join("\n");

    return {
      text: `📊 Gösterdiğim ürünlerin stok durumu:\n\n${stockInfo}`,
      quickReplies: [
        { label: "Stokta olanları göster", value: "stokta olan ürünleri göster", icon: "✅" },
        { label: "Sepete ekle", value: "ilkini sepete ekle", icon: "🛒" },
      ],
    };
  }

  // Try to find product by search text
  const searchTerms = rawText.replace(/stok(ta)?|var\s*m[ıi]|mevcut|kald[ıi]\s*m[ıi]/gi, "").trim();
  if (searchTerms.length > 3) {
    try {
      const { product, inStock } = await checkStockByName(searchTerms);
      if (product) {
        const status = inStock
          ? (product.stock > 5 ? "✅ Stokta mevcut!" : `⚠️ Son ${product.stock} adet kaldı!`)
          : "❌ Maalesef şu an stokta yok.";
        return {
          text: `📊 ${product.name}:\n\n${status}\n\nFiyat: ${formatPriceTR(product.sale_price || product.price)}`,
          products: inStock ? [{ product, showAddToCart: true }] : undefined,
          quickReplies: inStock
            ? [{ label: "Sepete ekle", value: "ilkini sepete ekle", icon: "🛒" }]
            : [{ label: "Alternatif göster", value: "alternatif ürün göster", icon: "🔄" }],
        };
      }
    } catch { /* ignore */ }
  }

  return {
    text: "Hangi ürünün stok durumunu öğrenmek istiyorsunuz? 🤔\n\nÜrün adını yazın veya önce ürün aratın, sonra stok bilgisini sorun.",
    quickReplies: getDefaultQuickReplies(),
  };
}

// ─── Shipping Info ───
function handleShippingInfo(context: ConversationContext): BotResponse {
  const hasProducts = context.lastShownProducts.length > 0;
  const shippingText = `📦 Kargo ve Teslimat Bilgileri:\n\n` +
    `• Kargo süresi: 1-3 iş günü\n` +
    `• 2.000₺ üzeri siparişlerde ücretsiz kargo 🎉\n` +
    `• Aynı gün kargo: 14:00'e kadar verilen siparişler\n` +
    `• Kurulum gerektiren ürünlerde randevulu teslimat\n` +
    `• Kargo takibi sipariş onayından sonra SMS ile gönderilir`;

  return {
    text: shippingText,
    quickReplies: hasProducts
      ? [
          { label: "Sepete ekle", value: "ilkini sepete ekle", icon: "🛒" },
          { label: "Sipariş takip", value: "siparişimi takip et", icon: "📋" },
        ]
      : [
          { label: "Ürün ara", value: "ürün öner", icon: "🔍" },
          { label: "Sipariş takip", value: "siparişimi takip et", icon: "📋" },
        ],
  };
}

// ─── Package Deal ───
async function handlePackageDeal(nlp: NLPResult, context: ConversationContext): Promise<BotResponse> {
  const category = nlp.entities.category || context.preferredCategory;
  const budget = nlp.entities.budget || context.budget;
  const budgetAmount = budget?.exact || budget?.max;

  // Default to camera if no category
  const targetCategory = category || "guvenlik-kameralari";
  const catName = nlp.entities.categoryName || context.preferredCategoryName || getCategoryDisplayName(targetCategory) || "Güvenlik";

  try {
    const { main, complementary } = await getPackageDeal(
      targetCategory,
      budgetAmount || undefined,
      3
    );

    if (main.length === 0) {
      return {
        text: `${catName} için paket oluşturacak ürün bulamadım 😔 Kategori seçerek devam edelim mi?`,
        quickReplies: getDefaultQuickReplies(),
      };
    }

    const allProducts = [...main, ...complementary];
    const totalPrice = allProducts.reduce((sum, p) => sum + (p.sale_price || p.price), 0);

    let text = `🎁 ${catName} Komple Paket Önerisi:\n\n`;
    text += `Ana ürünler (${main.length} adet) + Tamamlayıcı (${complementary.length} adet)\n`;
    text += `💰 Toplam tahmini: ${formatPriceTR(totalPrice)}`;

    if (complementary.length > 0) {
      text += `\n\n💡 Tamamlayıcı ürünler de eklendi — komple sistem için ihtiyacınız olacak!`;
    }

    return {
      text,
      products: allProducts.map((p) => ({ product: p, showAddToCart: true })),
      quickReplies: [
        { label: "Hepsini sepete ekle", value: "hepsini sepete ekle", icon: "🛒" },
        { label: "Daha ucuz paket", value: "daha ucuz paket göster", icon: "💵" },
        { label: "Daha kapsamlı", value: "daha kapsamlı paket", icon: "⭐" },
      ],
      newState: "SHOWING_PRODUCTS",
      updateContext: { lastShownProducts: allProducts },
    };
  } catch {
    return { text: "Paket önerisi oluştururken sorun oluştu. Lütfen tekrar deneyin." };
  }
}

function handleCasual(nlp: NLPResult): BotResponse {
  const text = nlp.normalizedText;
  let responses: string[];

  if (text.includes("hava")) responses = CASUAL_RESPONSES.weather;
  else if (text.includes("futbol") || text.includes("mac")) responses = CASUAL_RESPONSES.football;
  else if (text.includes("saka") || text.includes("espri")) responses = CASUAL_RESPONSES.joke;
  else if (text.includes("ask") || text.includes("sevgili")) responses = CASUAL_RESPONSES.love;
  else if (text.includes("yemek")) responses = CASUAL_RESPONSES.food;
  else responses = CASUAL_RESPONSES.default;

  return {
    text: pick(responses),
    quickReplies: getDefaultQuickReplies(),
  };
}

async function handleUnknown(nlp: NLPResult, context: ConversationContext): Promise<BotResponse> {
  // Try knowledge base
  const knowledge = findKnowledge(nlp.rawText);
  if (knowledge) {
    return {
      text: `📋 ${knowledge.topic}:\n\n${knowledge.content}`,
      quickReplies: getDefaultQuickReplies(),
    };
  }

  // Try tech term
  const term = findTechTerm(nlp.rawText);
  if (term) {
    return {
      text: `📚 ${term}`,
      quickReplies: getDefaultQuickReplies(),
    };
  }

  // If we have context, try a product search
  if (context.preferredCategory || context.budget) {
    // Contextual fallback — remind user what they were looking at
    if (context.preferredCategory) {
      const catName = context.preferredCategoryName || getCategoryDisplayName(context.preferredCategory) || "seçtiğiniz kategori";
      const categoryQuickReplies: QuickReply[] = [];

      if (context.preferredCategory === "guvenlik-kameralari") {
        categoryQuickReplies.push(
          { label: "Kamera öner", value: "kamera öner", icon: "📷" },
          { label: "İndirimli kameralar", value: "indirimli kamera", icon: "🔥" },
        );
      } else if (context.preferredCategory === "alarm-sistemleri") {
        categoryQuickReplies.push(
          { label: "Alarm öner", value: "alarm sistemi öner", icon: "🚨" },
          { label: "İndirimli alarmlar", value: "indirimli alarm", icon: "🔥" },
        );
      } else if (context.preferredCategory === "akilli-ev-sistemleri" || context.preferredCategory === "akilli-kilit") {
        categoryQuickReplies.push(
          { label: "Kilit öner", value: "akıllı kilit öner", icon: "🔐" },
          { label: "İndirimli kilitler", value: "indirimli kilit", icon: "🔥" },
        );
      } else {
        categoryQuickReplies.push(
          { label: "Ürün öner", value: "ürün öner", icon: "🎯" },
          { label: "İndirimler", value: "indirimli ürünler", icon: "🔥" },
        );
      }
      categoryQuickReplies.push(
        { label: "Farklı kategori", value: "farklı kategori göster", icon: "🔄" },
        { label: "Destek", value: "müşteri hizmetleri", icon: "📞" },
      );

      return {
        text: `Tam anlayamadım ama ${catName} kategorisine bakıyordunuz. Devam edelim mi? 🤔`,
        quickReplies: categoryQuickReplies,
      };
    }
    return handleProductIntent(nlp, context);
  }

  // Fallback
  const fallbacks = [
    "Hmm, tam olarak anlayamadım 🤔 Biraz daha detay verebilir misiniz?\n\nÖrneğin: \"3000 TL'ye kamera öner\" veya \"alarm sistemi bakıyorum\" gibi.",
    "Bunu anlayamadım 😅 Size yardımcı olabilmem için:\n• Ne aradığınızı (kamera, alarm, kilit...)\n• Bütçenizi söylemeniz yeterli!",
    "Bu konuda yardımcı olamıyorum ama güvenlik sistemleri konusunda uzmanım! 🔒 Ne arıyorsunuz?",
  ];
  return {
    text: pick(fallbacks),
    quickReplies: getDefaultQuickReplies(),
    actions: [
      { label: "Bizi Arayın", type: "phone", href: `tel:${CONTACT.phone}`, icon: "phone" },
    ],
  };
}

// ─── Default Quick Replies ───
function getDefaultQuickReplies(): QuickReply[] {
  return [
    { label: "Kamera Öner", value: "kamera öner", icon: "📷" },
    { label: "Alarm Sistemi", value: "alarm sistemi bakıyorum", icon: "🚨" },
    { label: "Akıllı Kilit", value: "akıllı kilit öner", icon: "🔐" },
    { label: "İndirimler", value: "indirimli ürünler", icon: "🔥" },
  ];
}
