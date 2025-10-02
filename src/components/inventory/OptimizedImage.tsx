import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { getOptimizedImageUrl, getResponsiveImageSrcSet, generateBlurDataURL } from '../../utils/imageOptimization';

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  priority?: boolean;
  width?: number;
  height?: number;
}

// Global cache to store loaded image URLs
const imageCache = new Set<string>();

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackIcon,
  priority = false,
  width,
  height
}) => {
  // Optimize image URL with transformations
  const optimizedSrc = getOptimizedImageUrl(src, { width, height, quality: 85, format: 'webp' });
  const blurDataURL = generateBlurDataURL(src);
  const srcSet = src ? getResponsiveImageSrcSet(src, { quality: 85, format: 'webp' }) : '';

  const [isLoaded, setIsLoaded] = useState(() => {
    // Check if image is already cached
    return optimizedSrc ? imageCache.has(optimizedSrc) : false;
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
        rootMargin: '200px',
        threshold: 0.01
      }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  // Preload critical images
  useEffect(() => {
    if (priority && optimizedSrc && !imageCache.has(optimizedSrc)) {
      const img = new Image();
      img.src = optimizedSrc;
      if (srcSet) img.srcset = srcSet;
      img.onload = () => {
        imageCache.add(optimizedSrc);
        setIsLoaded(true);
      };
      img.onerror = () => setIsError(true);
    }
  }, [optimizedSrc, srcSet, priority]);

  const handleImageLoad = () => {
    if (optimizedSrc) {
      imageCache.add(optimizedSrc);
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
      {/* Blur placeholder while loading */}
      {!isLoaded && !imageCache.has(optimizedSrc) && blurDataURL && (
        <div className="absolute inset-0">
          <img
            src={blurDataURL}
            alt=""
            className="w-full h-full object-cover blur-xl scale-110"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gray-100/50 dark:bg-gray-700/50"></div>
        </div>
      )}

      {/* Loading spinner */}
      {!isLoaded && !imageCache.has(optimizedSrc) && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Actual image */}
      {(isInView || imageCache.has(optimizedSrc)) && optimizedSrc && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          srcSet={srcSet || undefined}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded || imageCache.has(optimizedSrc) ? 'opacity-100' : 'opacity-0'
          }`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
        />
      )}
    </div>
  );
};