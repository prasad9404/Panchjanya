import DOMPurify from 'dompurify';
import { cn } from "@/shared/lib/utils";
import { getTranslatedValue, getLangCode } from '../../utils/translationUtils';
import { useTranslation } from 'react-i18next';

interface SafeHTMLProps {
  html: any;
  className?: string;
}

/**
 * Icon mapping based on link keywords
 */
const getLinkIcon = (url: string, text: string): string => {
  const combined = (url + " " + text).toLowerCase();
  
  if (combined.includes('maps.google') || combined.includes('goo.gl/maps') || combined.includes('location') || combined.includes('maps.app.goo.gl')) {
    return `<span class="shrink-0 opacity-70"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg></span>`;
  }
  if (combined.includes('image') || combined.includes('photo') || combined.includes('gallery') || combined.includes('.jpg') || combined.includes('.png')) {
    return `<span class="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></span>`;
  }
  if (combined.includes('pdf') || combined.includes('download') || combined.includes('doc')) {
    return `<span class="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg></span>`;
  }
  
  return `<span class="shrink-0 opacity-70"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg></span>`;
};

/**
 * Enhanced Linkify function that:
 * 1. Detects plain URLs and wraps them in <a> tags
 * 2. Standardizes all <a> tags with icons and blue minimal styling
 */
const processLinks = (html: string): string => {
  if (!html) return "";

  // 1. Auto-linkify plain URLs first
  // Improved regex to avoid matching URLs inside attributes or tags
  const urlRegex = /(?<!href="|src="|">)(https?:\/\/[^\s<]+)/g;
  let processed = html.replace(urlRegex, (url) => {
    // Sanitize components before template literal interpolation to prevent XSS
    const safeUrl = DOMPurify.sanitize(url);
    const safeLabel = DOMPurify.sanitize((url.includes('maps.google') || url.includes('maps.app.goo.gl')) ? "Open in Maps" : url);
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`;
  });

  // 2. Wrap all <a> tags (existing and new) with the new UI styles and icons
  // This regex finds <a> tags and replaces them with a version that has icons and styles
  const anchorRegex = /<a\s+([^>]*?href="([^"]*?)"[^>]*?)>(.*?)<\/a>/gi;
  
  return processed.replace(anchorRegex, (match, attrs, url, content) => {
    // Determine icon based on URL and content
    const icon = getLinkIcon(url, content);
    
    // Standard style classes
    const linkClasses = "inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline font-medium transition-all no-underline break-all group";
    
    // Ensure standard attributes (target="_blank" for external links)
    const isInternal = url.startsWith('/') || url.includes(window.location.hostname);
    const targetAttr = isInternal ? "" : 'target="_blank" rel="noopener noreferrer"';
    const safeAttrs = attrs.includes('target=') ? attrs : `${attrs} ${targetAttr}`;
    
    // Sanitize dynamic content before template literal interpolation
    const safeContent = DOMPurify.sanitize(content);
    
    return `<a ${safeAttrs} class="${linkClasses}"><span class="relative border-b border-blue-600/30 group-hover:border-blue-700 transition-all">${safeContent}</span>${icon}</a>`;
  });
};

export const SafeHTML = ({ html, className }: SafeHTMLProps) => {
  const { i18n } = useTranslation();
  const langCode = getLangCode(i18n.language || 'en');

  const safeContent = typeof html === "string" ? html : getTranslatedValue(html, langCode);

  if (!safeContent) return null;

  // Process links to add icons and styles
  const linkified = processLinks(safeContent);

  // Call DOMPurify.sanitize directly inside dangerouslySetInnerHTML to satisfy static analyzers
  return (
    <div
      className={cn("safe-html prose prose-slate max-w-none prose-a:no-underline", className)}
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(linkified, {
          ADD_ATTR: ['target', 'rel', 'class'],
          ADD_TAGS: ['svg', 'path', 'circle', 'rect', 'polyline'], // Allow basic SVG for icons
        })
      }}
    />
  );
};
