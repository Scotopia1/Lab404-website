import React, { useState, useRef, useEffect, ImgHTMLAttributes, CSSProperties } from 'react';
import { useReducedMotion } from '@/hooks/useFocusManagement';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading' | 'onLoad' | 'onError'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  fallbackSrc?: string;
}

// Image skeleton component
const ImageSkeleton: React.FC<{ width?: number; height?: number; className?: string }> = ({ 
  width, 
  height, 
  className = '' 
}) => {
  const style: CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`bg-gray-200 animate-pulse rounded w-full h-full flex items-center justify-center ${className}`}
      style={style}
      role="presentation"
      aria-hidden="true"
    >
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  );
};

// Error fallback component
const ImageError: React.FC<{ width?: number; height?: number; className?: string; alt: string }> = ({ 
  width, 
  height, 
  className = '',
  alt
}) => {
  const style: CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center w-full h-full ${className}`}
      style={style}
      role="img"
      aria-label={`Failed to load image: ${alt}`}
    >
      <div className="text-gray-500 text-center p-2">
        <svg
          className="h-8 w-8 mx-auto mb-2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="text-xs">Image unavailable</span>
      </div>
    </div>
  );
};

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  sizes,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  fallbackSrc,
  className = '',
  style,
  ...props
}) => {
  const [loading, setLoading] = useState(!priority);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { prefersReducedMotion } = useReducedMotion();
  const loadedSrcRef = useRef<string | null>(null);

  // Update currentSrc when src prop changes
  useEffect(() => {
    setCurrentSrc(src);

    // Check if image is already cached/loaded
    if (priority && imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setLoading(false);
      setError(false);
      loadedSrcRef.current = src;
    } else if (priority) {
      // For priority images, show immediately but keep loading state
      // This prevents blank screen while image loads
      setLoading(false);
      setError(false);
    } else {
      // For lazy images, reset loading state
      if (loadedSrcRef.current !== src) {
        setLoading(true);
        setError(false);
      }
    }
  }, [src, priority]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !src) return;

    const img = imgRef.current;
    if (!img) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCurrentSrc(src);
          observerRef.current?.unobserve(img);
          observerRef.current?.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px' // Start loading 50px before image enters viewport
      }
    );

    observerRef.current.observe(img);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, priority]);

  // Preload critical images
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      if (sizes) link.setAttribute('imagesizes', sizes);
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, src, sizes]);

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setLoading(false);
    setError(false);
    loadedSrcRef.current = currentSrc;
    onLoad?.(event);
  };

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setLoading(false);
    setError(true);

    // Try fallback image if available
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setError(false);
      setLoading(true);
      return;
    }

    onError?.(event);
  };

  // Generate responsive image srcset
  const generateSrcSet = (baseSrc: string): string => {
    if (!width || !baseSrc.includes('http')) return baseSrc;
    
    // For external images, we can't generate responsive versions
    // In a real app, you'd integrate with image optimization services
    return baseSrc;
  };

  // Calculate aspect ratio for consistent layout
  const aspectRatio = width && height ? height / width : undefined;
  
  const imgStyle: CSSProperties = {
    ...style,
    transition: prefersReducedMotion
      ? 'none'
      : 'opacity 0.3s ease-in-out',
    opacity: (priority || !loading) ? 1 : 0,
  };

  if (width) imgStyle.width = width;
  if (height) imgStyle.height = height;
  if (aspectRatio && !height) {
    imgStyle.aspectRatio = `${width} / ${Math.round(width * aspectRatio)}`;
  }

  return (
    <div className="relative overflow-hidden" style={{ width, height }}>
      {/* Blur placeholder */}
      {placeholder === 'blur' && blurDataURL && loading && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-105"
          aria-hidden="true"
        />
      )}
      
      {/* Loading skeleton */}
      {loading && placeholder === 'empty' && (
        <ImageSkeleton width={width} height={height} className="absolute inset-0" />
      )}
      
      {/* Error state */}
      {error && (
        <ImageError 
          width={width} 
          height={height} 
          className="absolute inset-0" 
          alt={alt}
        />
      )}
      
      {/* Main image */}
      {currentSrc && !error && (
        <img
          ref={imgRef}
          src={currentSrc}
          srcSet={generateSrcSet(currentSrc)}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`object-cover ${className}`}
          style={imgStyle}
          {...props}
        />
      )}
      
      {/* Image placeholder div for intersection observer when not priority */}
      {!priority && !currentSrc && (
        <div
          ref={imgRef}
          className="w-full h-full"
          style={{ width, height, aspectRatio: aspectRatio ? `${width} / ${Math.round(width * aspectRatio)}` : undefined }}
        >
          <ImageSkeleton width={width} height={height} className="w-full h-full" />
        </div>
      )}
    </div>
  );
};

// Utility hook for image preloading
export const useImagePreload = (src: string): boolean => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setLoaded(false);
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return loaded;
};

// Progressive image loading component
export const ProgressiveImage: React.FC<OptimizedImageProps & { 
  lowQualitySrc?: string;
  highQualitySrc: string;
}> = ({ lowQualitySrc, highQualitySrc, alt, className, ...props }) => {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc || highQualitySrc);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);
  const highQualityLoaded = useImagePreload(highQualitySrc);

  useEffect(() => {
    if (highQualityLoaded && !isHighQualityLoaded) {
      setCurrentSrc(highQualitySrc);
      setIsHighQualityLoaded(true);
    }
  }, [highQualityLoaded, highQualitySrc, isHighQualityLoaded]);

  return (
    <OptimizedImage
      {...props}
      src={currentSrc}
      alt={alt}
      className={`${className} ${!isHighQualityLoaded ? 'filter blur-sm' : ''}`}
    />
  );
};

export default OptimizedImage;