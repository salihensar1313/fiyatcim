import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sepetim",
  description: "Fiyatcim.com alışveriş sepetiniz.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
