import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_FULL_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";
import LayoutShell from "@/components/layout/LayoutShell";
import { AuthProvider } from "@/context/AuthContext";
import { ProductProvider } from "@/context/ProductContext";
import { OrderProvider } from "@/context/OrderContext";
import { CouponProvider } from "@/context/CouponContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AddressProvider } from "@/context/AddressContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { ToastProvider } from "@/components/ui/Toast";
import CookieConsent from "@/components/ui/CookieConsent";
import GoogleAnalytics from "@/components/seo/GoogleAnalytics";
import WebVitals from "@/components/analytics/WebVitals";
import { ThemeProvider } from "@/context/ThemeContext";
import { ActivityLogProvider } from "@/context/ActivityLogContext";
import { ReturnProvider } from "@/context/ReturnContext";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import JsonLd, { buildOrganizationSchema, buildWebSiteSchema, buildLocalBusinessSchema } from "@/components/seo/JsonLd";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  manifest: "/manifest.json",
  themeColor: "#DC2626",
  title: {
    default: SITE_FULL_NAME,
    template: "%s | Fiyatcim",
  },
  description: SITE_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fiyatcim",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: SITE_FULL_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "Fiyatcim",
    locale: "tr_TR",
    type: "website",
    images: [{ url: `${SITE_URL}/images/og-image.png`, width: 1200, height: 630, alt: "Fiyatcim.com" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_FULL_NAME,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/images/og-image.png`],
  },
};

/**
 * Provider sırası (değişmez):
 * Auth → Product → Order → Coupon → Cart → Wishlist → Toast → LayoutShell
 *
 * Sprint 3'te eklenecek: CategoryProvider, BrandProvider
 * Tam sıra: Auth → Product → Category → Brand → Order → Coupon → Cart → Wishlist → Toast
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("fiyatcim_theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <GoogleAnalytics />
        <WebVitals />
        <JsonLd data={buildOrganizationSchema()} />
        <JsonLd data={buildWebSiteSchema()} />
        <JsonLd data={buildLocalBusinessSchema()} />
        <ThemeProvider>
        <CurrencyProvider>
        <AuthProvider>
          <ProductProvider>
            <OrderProvider>
              <CouponProvider>
              <CartProvider>
                <WishlistProvider>
                <AddressProvider>
                <ActivityLogProvider>
                <ReturnProvider>
                  <ToastProvider>
                    <ErrorBoundary>
                      <LayoutShell>{children}</LayoutShell>
                    </ErrorBoundary>
                    <CookieConsent />
                  </ToastProvider>
                </ReturnProvider>
                </ActivityLogProvider>
                </AddressProvider>
                </WishlistProvider>
              </CartProvider>
              </CouponProvider>
            </OrderProvider>
          </ProductProvider>
        </AuthProvider>
        </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
