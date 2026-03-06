import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "red" | "green" | "yellow" | "gray" | "blue";
  children: React.ReactNode;
  className?: string;
}

const variants = {
  red: "bg-primary-50 text-primary-700",
  green: "bg-green-50 text-green-700",
  yellow: "bg-yellow-50 text-yellow-700",
  gray: "bg-dark-100 text-dark-600 dark:text-dark-300",
  blue: "bg-blue-50 text-blue-700",
};

export default function Badge({ variant = "gray", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
