export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  resize?: 'cover' | 'contain' | 'fill';
}

export function getOptimizedImageUrl(
  url: string | null,
  options: ImageTransformOptions = {}
): string | null {
  if (!url) return null;

  // Check if it's a Supabase storage URL
  const supabaseStoragePattern = /supabase\.co\/storage\/v1\/object\/public\//;

  if (!supabaseStoragePattern.test(url)) {
    return url;
  }

  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    resize = 'cover'
  } = options;

  // Build Supabase image transformation parameters
  const params = new URLSearchParams();

  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  params.append('quality', quality.toString());
  params.append('format', format);
  params.append('resize', resize);

  // Check if URL already has query params
  const separator = url.includes('?') ? '&' : '?';

  return `${url}${separator}${params.toString()}`;
}

export function getResponsiveImageSrcSet(
  url: string | null,
  options: ImageTransformOptions = {}
): string {
  if (!url) return '';

  const widths = [320, 640, 960, 1280, 1920];
  const srcSet = widths.map(width => {
    const optimizedUrl = getOptimizedImageUrl(url, { ...options, width });
    return `${optimizedUrl} ${width}w`;
  }).join(', ');

  return srcSet;
}

export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

export function generateBlurDataURL(url: string | null): string | null {
  if (!url) return null;

  return getOptimizedImageUrl(url, {
    width: 20,
    height: 20,
    quality: 10
  });
}
