import React, { useState } from "react";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    containerClassName?: string;
}

export const LazyImage = ({ src, alt, className, containerClassName, ...props }: LazyImageProps) => {
    const [loaded, setLoaded] = useState(false);

    return (
        <div className={cn("relative overflow-hidden bg-muted/20", containerClassName)}>
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Skeleton className="w-full h-full" />
                </div>
            )}
            <img
                src={src}
                alt={alt}
                onLoad={() => setLoaded(true)}
                className={cn(
                    "transition-opacity duration-500",
                    loaded ? "opacity-100" : "opacity-0",
                    className
                )}
                loading="lazy"
                {...props}
            />
        </div>
    );
};
