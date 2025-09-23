import React, { useState, useRef, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  priority?: boolean;
}

// Global cache to store loaded image URLs
const imageCache = new Set<string>();

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackIcon,
  priority = false
}) => {
  const [isLoaded, setIsLoaded] = useState(() => {
    // Check if image is already cached
    return src ? imageCache.has(src) : false;
  });
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !containerRef.current || isInView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before the image comes into view
        threshold: 0.1
      }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  // Preload critical images
  useEffect(() => {
    if (priority && src && !imageCache.has(src)) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        imageCache.add(src);
        setIsLoaded(true);
      };
      img.onerror = () => setIsError(true);
    }
  }, [src, priority]);

  const handleImageLoad = () => {
    if (src) {
      imageCache.add(src);
      setIsLoaded(true);
      setIsError(false);
    }
  };

  const handleImageError = () => {
    setIsError(true);
    setIsLoaded(false);
  };

  if (!src || isError) {
    return (
      <div ref={containerRef} className={`flex items-center justify-center bg-gray-100 dark:bg-gray-700 ${className}`}>
        {fallbackIcon || <ImageIcon className="h-8 w-8 text-gray-400" />}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder while loading - only show if not cached */}
      {!isLoaded && !imageCache.has(src) && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <div className="optimized-image-placeholder absolute inset-0"></div>
          <div className="relative z-10 w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
        </div>
      )}
      
      {/* Actual image */}
      {(isInView || imageCache.has(src)) && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded || imageCache.has(src) ? 'opacity-100' : 'opacity-0'
          }`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
    </div>
  );
};