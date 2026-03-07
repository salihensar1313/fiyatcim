"use client";

import { X, User, ShoppingCart, Heart } from "lucide-react";
import Link from "next/link";
import { NAV_LINKS, CONTACT } from "@/lib/constants";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { getItemCount } = useCart();
  const { getCount: getWishlistCount } = useWishlist();
  const cartCount = getItemCount();
  const wishlistCount = getWishlistCount();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Menu */}
      <div
        className={`fixed left-0 top-0 z-50 flex h-full w-80 max-w-[85vw] transform flex-col bg-white dark:bg-dark-800 shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-100 px-4 py-4 dark:border-dark-700">
          <span className="text-lg font-bold text-dark-900 dark:text-dark-50">Menü</span>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-dark-500 dark:text-dark-400 hover:bg-dark-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Actions */}
        <div className="border-b border-dark-100 px-4 py-3 dark:border-dark-700">
          <div className="flex items-center gap-2">
            <Link
              href="/hesabim"
              onClick={onClose}
              className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:text-dark-200 dark:hover:bg-dark-700"
            >
              <User size={18} />
              Hesabım
            </Link>
            <Link
              href="/sepet"
              onClick={onClose}
              className="relative flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:text-dark-200 dark:hover:bg-dark-700"
            >
              <ShoppingCart size={18} />
              Sepet
              {cartCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              href="/hesabim/favorilerim"
              onClick={onClose}
              className="relative flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:text-dark-200 dark:hover:bg-dark-700"
            >
              <Heart size={18} />
              {wishlistCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Category Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-dark-400">
            Kategoriler
          </p>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={onClose}
              className="block rounded-lg px-3 py-3 font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:text-dark-200 dark:hover:bg-dark-700"
            >
              {link.label}
            </Link>
          ))}
          <div className="my-3 border-t border-dark-100" />
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-dark-400">
            Bilgi
          </p>
          <Link
            href="/hakkimizda"
            onClick={onClose}
            className="block rounded-lg px-3 py-2.5 text-sm text-dark-600 dark:text-dark-300 hover:bg-dark-50 dark:text-dark-300 dark:hover:bg-dark-700"
          >
            Hakkımızda
          </Link>
          <Link
            href="/blog"
            onClick={onClose}
            className="block rounded-lg px-3 py-2.5 text-sm text-dark-600 dark:text-dark-300 hover:bg-dark-50 dark:text-dark-300 dark:hover:bg-dark-700"
          >
            Blog
          </Link>
          <Link
            href="/iletisim"
            onClick={onClose}
            className="block rounded-lg px-3 py-2.5 text-sm text-dark-600 dark:text-dark-300 hover:bg-dark-50 dark:text-dark-300 dark:hover:bg-dark-700"
          >
            İletişim
          </Link>
          <Link
            href="/sss"
            onClick={onClose}
            className="block rounded-lg px-3 py-2.5 text-sm text-dark-600 dark:text-dark-300 hover:bg-dark-50 dark:text-dark-300 dark:hover:bg-dark-700"
          >
            SSS
          </Link>
        </nav>

        {/* Contact */}
        <div className="border-t border-dark-100 px-4 py-4 dark:border-dark-700">
          <p className="text-xs font-medium text-dark-500 dark:text-dark-400">İletişim</p>
          <a
            href={`mailto:${CONTACT.email}`}
            className="mt-1 block text-sm font-medium text-primary-600 hover:underline"
          >
            {CONTACT.email}
          </a>
        </div>
      </div>
    </>
  );
}
