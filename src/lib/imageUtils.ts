/**
 * Image utility functions for handling image loading and fallbacks
 */

export const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x300?text=No+Image';

/**
 * Handle image error by setting a placeholder
 */
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  const img = event.currentTarget;
  // Prevent infinite loop if placeholder also fails
  if (img.src !== PLACEHOLDER_IMAGE) {
    img.src = PLACEHOLDER_IMAGE;
  }
};

/**
 * Get valid image URL or placeholder
 */
export const getValidImageUrl = (url: string | undefined | null): string => {
  if (!url || url.includes('undefined') || url.includes('null')) {
    return PLACEHOLDER_IMAGE;
  }
  return url;
};

/**
 * Check if image URL is valid
 */
export const isValidImageUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  if (url.includes('undefined') || url.includes('null')) return false;

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Get first valid image from array or placeholder
 */
export const getFirstValidImage = (images: string[] | undefined | null): string => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return PLACEHOLDER_IMAGE;
  }

  const validImage = images.find(img => isValidImageUrl(img));
  return validImage || PLACEHOLDER_IMAGE;
};