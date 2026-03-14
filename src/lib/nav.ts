import {
  Shield,
  Camera,
  Home,
  Fingerprint,
  Package,
  Bell,
  Lock,
  Wifi,
  Eye,
  Monitor,
  Radio,
  Flame,
  Zap,
  Speaker,
  Server,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Lucide ikon adi → component mapping. Yeni ikon eklemek icin buraya ekle. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Shield,
  Camera,
  Home,
  Fingerprint,
  Package,
  Bell,
  Lock,
  Wifi,
  Eye,
  Monitor,
  Radio,
  Flame,
  Zap,
  Speaker,
  Server,
};

/** Ikon adina gore LucideIcon dondurur. Bulunamazsa Package (varsayilan). */
export function getCategoryIcon(iconName?: string): LucideIcon {
  if (!iconName) return Package;
  return CATEGORY_ICONS[iconName] || Package;
}

/** Masaustu uygulamada dropdown icin kullanilabilecek ikon listesi. */
export const AVAILABLE_ICONS = Object.keys(CATEGORY_ICONS);
