import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/hesabim/", "/odeme/", "/sepet/", "/siparis-basarili/", "/siparis-basarisiz/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
