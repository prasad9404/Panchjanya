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
      {/* Watermark Overlay (Removed as requested) */}
      
      {/* Content */}
      <div className="w-full h-full relative z-10">
        {children}
      </div>
    </div>
  );
}
