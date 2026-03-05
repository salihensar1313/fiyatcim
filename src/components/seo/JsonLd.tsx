/**
 * JSON-LD Schema Markup Bileşeni
 *
 * Kural: İçerik her zaman JSON.stringify ile serialize edilir.
 * String birleştirme YASAK (Sprint 2 Security Baseline — GATE 4).
 * dangerouslySetInnerHTML sadece JSON-LD için kullanılabilir.
 */

interface JsonLdProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// --- Schema Builder Helpers ---

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Fiyatcim",
    url: "https://www.fiyatcim.com",
    logo: "https://www.fiyatcim.com/images/logo.png",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+90-264-xxx-xxxx",
      contactType: "customer service",
      availableLanguage: "Turkish",
    },
    sameAs: [
      "https://instagram.com/fiyatcim",
      "https://youtube.com/@fiyatcim",
    ],
  };
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Fiyatcim",
    url: "https://www.fiyatcim.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.fiyatcim.com/urunler?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
}

interface ProductSchemaInput {
  name: string;
  description: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  brand: string;
  imageUrl: string;
}

export function buildProductSchema(product: ProductSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.imageUrl,
    url: `https://www.fiyatcim.com/urunler/${product.slug}`,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "TRY",
      price: product.salePrice || product.price,
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Fiyatcim",
      },
    },
  };
}

interface FAQItem {
  question: string;
  answer: string;
}

export function buildFAQSchema(items: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

// --- BreadcrumbList Schema ---

interface BreadcrumbItem {
  name: string;
  href?: string;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: "https://www.fiyatcim.com" },
      ...items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: item.name,
        ...(item.href ? { item: `https://www.fiyatcim.com${item.href}` } : {}),
      })),
    ],
  };
}

// --- LocalBusiness Schema ---

export function buildLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "Fiyatcim.com",
    url: "https://www.fiyatcim.com",
    logo: "https://www.fiyatcim.com/images/logo.png",
    image: "https://www.fiyatcim.com/images/logo.png",
    description: "Uzman onaylı elektronik ürünler ve güvenilir alışveriş deneyimi.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "İstanbul",
      addressCountry: "TR",
    },
    priceRange: "$$",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
  };
}
