import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  rating: number;
  size?: "sm" | "md";
  showCount?: boolean;
  count?: number;
}

export default function Rating({ rating, size = "md", showCount, count }: RatingProps) {
  const iconSize = size === "sm" ? 14 : 18;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={iconSize}
          className={cn(
            i < Math.floor(rating)
              ? "fill-yellow-400 text-yellow-400"
              : i < rating
              ? "fill-yellow-400/50 text-yellow-400"
              : "fill-dark-200 text-dark-200"
          )}
        />
      ))}
      {showCount && count !== undefined && (
        <span className="ml-1 text-xs text-dark-500 dark:text-dark-400">({count})</span>
      )}
    </div>
  );
}
