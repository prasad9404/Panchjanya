import React, { ReactNode } from 'react';

interface ProtectedContentProps {
  children: ReactNode;
  watermarkText?: string;
}

export function ProtectedContent({ children, watermarkText }: ProtectedContentProps) {
  return (
    <div 
      className="relative w-full h-full"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
      onDragStart={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
    >
      {/* Watermark Overlay */}
      {watermarkText && (
        <div 
          className="absolute inset-0 overflow-hidden pointer-events-none z-50 flex flex-wrap justify-center content-center gap-16 opacity-[0.04]"
          aria-hidden="true"
        >
          {Array.from({ length: 40 }).map((_, i) => (
            <div 
              key={i} 
              className="transform -rotate-45 text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap select-none"
            >
              {watermarkText}
            </div>
          ))}
        </div>
      )}
      
      {/* Content */}
      <div className="w-full h-full relative z-10">
        {children}
      </div>
    </div>
  );
}
