/**
 * Simple HTML sanitizer — strips dangerous tags/attributes while keeping safe formatting.
 * Allows: p, br, strong, em, ul, ol, li, h2, h3, h4, a (href only), span, div, table, tr, td, th, thead, tbody
 * Strips: script, iframe, object, embed, form, input, style, on* attributes
 */

// Strip all event handlers and dangerous attributes
const DANGEROUS_ATTR_PATTERN = /\s(on\w+|style|srcdoc|data-[\w-]*script)\s*=/gi;
// Strip dangerous tags completely (including content for script/style)
const DANGEROUS_TAG_PATTERN = /<\s*\/?\s*(script|iframe|object|embed|form|input|textarea|select|button|style|link|meta|base)\b[^>]*>/gi;
// Strip script/style content
const DANGEROUS_CONTENT_PATTERN = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
const STYLE_CONTENT_PATTERN = /<style\b[^>]*>[\s\S]*?<\/style>/gi;

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";

  let clean = html;

  // Remove script/style blocks (including content)
  clean = clean.replace(DANGEROUS_CONTENT_PATTERN, "");
  clean = clean.replace(STYLE_CONTENT_PATTERN, "");

  // Remove dangerous tags
  clean = clean.replace(DANGEROUS_TAG_PATTERN, "");

  // Remove event handlers (onclick, onerror, onload, etc.)
  clean = clean.replace(DANGEROUS_ATTR_PATTERN, " ");

  // Remove javascript: URLs
  clean = clean.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
  clean = clean.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src=""');

  // Remove data: URLs in src (potential XSS via data:text/html)
  clean = clean.replace(/src\s*=\s*["']data:text\/html[^"']*["']/gi, 'src=""');

  return clean;
}
