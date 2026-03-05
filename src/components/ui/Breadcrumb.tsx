import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-dark-500">
      <Link href="/" className="flex items-center gap-1 transition-colors hover:text-primary-600">
        <Home size={14} />
        <span>Ana Sayfa</span>
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight size={14} className="text-dark-300" />
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-primary-600">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-dark-900">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
