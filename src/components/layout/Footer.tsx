import Link from "next/link";
import Image from "next/image";
import { MapPin, Mail, Clock, Instagram, Youtube, Linkedin, ShieldCheck } from "lucide-react";
import { FOOTER_LINKS, CONTACT, SOCIAL, SITE_FULL_NAME, SITE_DESCRIPTION } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-dark-900 text-dark-300">
      {/* Main Footer */}
      <div className="container-custom py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: About */}
          <div>
            <Link href="/" className="inline-block">
              <Image src="/images/logo-white.png" alt={SITE_FULL_NAME} width={140} height={40} className="h-10 w-auto" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-dark-400">
              Güvenlik teknolojilerinde uzman onaylı ürünler, karşılaştırmalar ve şeffaf alışveriş deneyimi. Bir Temiz İş Güvenlik kuruluşudur.
            </p>
            {/* Social */}
            <div className="mt-6 flex gap-3">
              <a
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="rounded-lg bg-dark-800 p-2 text-dark-400 transition-colors hover:bg-primary-600 hover:text-white"
              >
                <Instagram size={18} />
              </a>
              <a
                href={SOCIAL.x}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-dark-800 p-2 text-dark-400 transition-colors hover:bg-primary-600 hover:text-white"
                aria-label="X (Twitter)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href={SOCIAL.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="rounded-lg bg-dark-800 p-2 text-dark-400 transition-colors hover:bg-primary-600 hover:text-white"
              >
                <Youtube size={18} />
              </a>
              <a
                href={SOCIAL.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="rounded-lg bg-dark-800 p-2 text-dark-400 transition-colors hover:bg-primary-600 hover:text-white"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Col 2: Kurumsal + Rehber */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Kurumsal
            </h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.kurumsal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-dark-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="mb-4 mt-6 text-sm font-semibold uppercase tracking-wider text-white">
              Rehber
            </h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.rehber.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-dark-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Müşteri + Yasal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Müşteri Hizmetleri
            </h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.musteri.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-dark-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {FOOTER_LINKS.yasal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-dark-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: İletişim */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              İletişim
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-primary-500" />
                <span className="text-sm text-dark-400">{CONTACT.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="shrink-0 text-primary-500" />
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="text-sm text-dark-400 transition-colors hover:text-white"
                >
                  {CONTACT.email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Clock size={18} className="shrink-0 text-primary-500" />
                <span className="text-sm text-dark-400">{CONTACT.workingHours}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-dark-800">
        <div className="container-custom flex flex-col items-center gap-4 py-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <p className="text-xs text-dark-500 dark:text-dark-400">
              &copy; {new Date().getFullYear()} Fiyatcim.com. Tüm hakları saklıdır.
            </p>
            <p className="text-xs text-dark-500 dark:text-dark-400">
              Bu bir Temiz İş kuruluşudur.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm sm:justify-end">
            <span className="flex items-center gap-1.5 rounded-full bg-green-900/40 px-3 py-1.5 font-semibold text-green-400">
              <ShieldCheck size={14} />
              SSL Güvenli
            </span>
            <span className="rounded-full bg-dark-800 px-3 py-1.5 font-semibold text-dark-300">Visa</span>
            <span className="rounded-full bg-dark-800 px-3 py-1.5 font-semibold text-dark-300">Mastercard</span>
            <span className="rounded-full bg-dark-800 px-3 py-1.5 font-semibold text-dark-300">Troy</span>
            <span className="rounded-full bg-dark-800 px-3 py-1.5 font-semibold text-dark-300">Havale/EFT</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
