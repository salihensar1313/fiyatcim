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
      target: "https://www.fiyatcim.com/ara?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
}

interface ReviewSchemaInput {
  author: string;
  rating: number;
  comment: string;
  date: string;
}

interface ProductSchemaInput {
  name: string;
  description: string;
  slug: string;
  sku?: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  brand: string;
  imageUrl: string;
  reviewCount?: number;
  averageRating?: number;
  reviews?: ReviewSchemaInput[];
}

export function buildProductSchema(product: ProductSchemaInput) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schema: Record<string, any> = {
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

  // SKU
  if (product.sku) {
    schema.sku = product.sku;
  }

  // AggregateRating (only if reviews exist)
  if (product.reviewCount && product.reviewCount > 0 && product.averageRating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.averageRating.toFixed(1),
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Individual reviews (max 5 for schema)
  if (product.reviews && product.reviews.length > 0) {
    schema.review = product.reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: r.author,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: r.comment,
      datePublished: r.date,
    }));
  }

  return schema;
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

// --- Article Schema ---

interface ArticleSchemaInput {
  title: string;
  slug: string;
  excerpt: string;
  created_at: string;
  category: string;
}

export function buildArticleSchema(post: ArticleSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    url: `https://www.fiyatcim.com/blog/${post.slug}`,
    datePublished: post.created_at,
    author: { "@type": "Organization", name: "Fiyatcim" },
    publisher: {
      "@type": "Organization",
      name: "Fiyatcim",
      logo: { "@type": "ImageObject", url: "https://www.fiyatcim.com/images/logo.png" },
    },
    articleSection: post.category,
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
    name: "Fiyatcim",
    url: "https://www.fiyatcim.com",
    logo: "https://www.fiyatcim.com/images/logo.png",
    image: "https://www.fiyatcim.com/images/logo.png",
    description: "Uzman onaylı elektronik ürünler ve güvenilir alışveriş deneyimi.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Adapazarı",
      addressRegion: "Sakarya",
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
