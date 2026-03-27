import DOMPurify from 'dompurify';
import { cn } from "@/shared/lib/utils";

interface SafeHTMLProps {
  html: string;
  className?: string;
}

/**
 * Enhanced Linkify function that:
 * 1. Detects plain URLs and wraps them in <a> tags
 * 2. Identifies Google Maps links and adds a "Open in Maps" identifier/icon
 */
const linkify = (text: string): string => {
  if (!text) return "";

  // Regex to find URLs that are NOT already inside an <a> tag's href or content
  // This is a simplified version; for complex HTML, a DOM parser would be safer
  const urlRegex = /(?<!href="|src="|">)(https?:\/\/[^\s<]+)/g;

  return text.replace(urlRegex, (url) => {
    const isGoogleMaps = url.includes('maps.google.com') || url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps');
    
    if (isGoogleMaps) {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all font-medium no-underline my-1">
        <span class="w-4 h-4 text-amber-600"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span>
        Open in Maps
      </a>`;
    }

    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-amber-600 hover:text-amber-700 underline underline-offset-4 decoration-amber-600/30 transition-all font-medium inline-flex items-center gap-1">
      ${url}
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-70"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
    </a>`;
  });
};

export const SafeHTML = ({ html, className }: SafeHTMLProps) => {
  if (!html) return null;

  // First, handle auto-linkification
  const linkified = linkify(html);

  // Then sanitize with DOMPurify, allowing necessary attributes
  const sanitizedHTML = DOMPurify.sanitize(linkified, {
    ADD_ATTR: ['target', 'rel', 'class'],
    ADD_TAGS: ['svg', 'path', 'circle'], // Allow basic SVG for icons
  });

  return (
    <div
      className={cn("safe-html prose prose-slate max-w-none prose-a:no-underline", className)}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};
