"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Tag, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getProductsByIds } from "@/lib/queries";
import type { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { trackViewItemList } from "@/lib/analytics";

interface Campaign {
  id: string;
  slug: string;
  title: string;
  description: string;
  banner_image: string;
  product_ids: string[];
  start_date: string;
  end_date: string | null;
  is_active: boolean;
}

export default function CampaignPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const supabase = createClient();
    supabase
      .from("campaigns")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single()
      .then(async ({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setCampaign(data as Campaign);

        // Kampanya ürünlerini çek
        if (data.product_ids?.length > 0) {
          const prods = await getProductsByIds(data.product_ids);
          setProducts(prods);
          trackViewItemList(`Kampanya: ${data.title}`, prods);
        }

        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ProductGridSkeleton count={8} />
      </div>
    );
  }

  if (notFound || !campaign) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Tag size={48} className="mx-auto mb-4 text-dark-300" />
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Kampanya Bulunamadı</h1>
        <p className="mt-2 text-dark-500">Bu kampanya sona ermiş veya kaldırılmış olabilir.</p>
      </div>
    );
  }

  const isExpired = campaign.end_date && new Date(campaign.end_date) < new Date();

  return (
    <div className="bg-dark-50 dark:bg-dark-900 min-h-screen">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[
          { label: "Kampanyalar", href: "/kampanyalar" },
          { label: campaign.title },
        ]} />
      </div>

      {/* Banner */}
      {campaign.banner_image && (
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-xl mx-4 mb-8">
          <Image
            src={campaign.banner_image}
            alt={campaign.title}
            width={1400}
            height={400}
            className="w-full object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="container mx-auto px-4 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50 sm:text-3xl">
            {campaign.title}
          </h1>
          {campaign.description && (
            <p className="mt-2 text-dark-500 dark:text-dark-400">{campaign.description}</p>
          )}
          <div className="mt-3 flex items-center gap-4 text-sm text-dark-400">
            {campaign.end_date && (
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {isExpired ? "Sona erdi" : `${new Date(campaign.end_date).toLocaleDateString("tr-TR")}'e kadar`}
              </span>
            )}
            <span>{products.length} ürün</span>
          </div>
        </div>

        {/* Products */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-center text-dark-500 py-12">Bu kampanyada henüz ürün bulunmuyor.</p>
        )}
      </div>
    </div>
  );
}
