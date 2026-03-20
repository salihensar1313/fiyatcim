import { CATEGORY_IMAGES, CATEGORY_IMAGES_BY_SLUG } from "@/lib/constants";
import type { Product } from "@/types";

const DEFAULT_PRODUCT_IMAGE = "/images/categories/alarm.png";

type ProductImageSource = Pick<Product, "images" | "category_id"> & {
  category?: { slug: string } | null;
};

export function getCategoryFallbackImage(categoryId?: string | null, categorySlug?: string | null): string {
  return (categoryId ? CATEGORY_IMAGES[categoryId] : null)
    || (categorySlug ? CATEGORY_IMAGES_BY_SLUG[categorySlug] : null)
    || DEFAULT_PRODUCT_IMAGE;
}

export function getProductPrimaryImage(product: ProductImageSource): string {
  if (product.images?.length && product.images[0]) return product.images[0];
  return getCategoryFallbackImage(product.category_id, product.category?.slug);
}

export function isRemoteImage(src: string): boolean {
  return /^https?:\/\//i.test(src);
}
