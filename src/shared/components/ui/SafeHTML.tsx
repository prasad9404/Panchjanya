import DOMPurify from 'dompurify';
import { cn } from "@/shared/lib/utils";

interface SafeHTMLProps {
  html: string;
  className?: string;
}

export const SafeHTML = ({ html, className }: SafeHTMLProps) => {
  if (!html) return null;

  const sanitizedHTML = DOMPurify.sanitize(html);

  return (
    <div
      className={cn("safe-html prose prose-slate max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};
