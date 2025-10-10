/**
 * Utility functions for generating fallback images locally
 * Replaces external placeholder services that may fail
 */

export const createFallbackImage = (width: number, height: number, text: string = 'No Image'): string => {
  // Create a canvas element to generate the image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Set background
  ctx.fillStyle = '#f3f4f6'; // Gray-100
  ctx.fillRect(0, 0, width, height);

  // Set text style
  const fontSize = Math.min(width, height) * 0.1;
  ctx.fillStyle = '#6b7280'; // Gray-500
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw text
  ctx.fillText(text, width / 2, height / 2);

  // Return as data URL
  return canvas.toDataURL('image/png');
};

// Pre-generated fallback images for common sizes
export const fallbackImages = {
  productCard: () => createFallbackImage(300, 200, 'No Image'),
  productDetail: () => createFallbackImage(600, 600, 'Product Image'),
  thumbnail: () => createFallbackImage(80, 80, 'Thumb'),
  square: (size: number, text?: string) => createFallbackImage(size, size, text || 'Image'),
  rectangle: (width: number, height: number, text?: string) => createFallbackImage(width, height, text || 'Image')
};

// Static SVG fallbacks as data URLs (lighter and more reliable)
export const svgFallbacks = {
  productCard: `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
      <rect width="300" height="200" fill="#f3f4f6"/>
      <text x="150" y="100" text-anchor="middle" dominant-baseline="middle" 
            font-family="system-ui, sans-serif" font-size="16" fill="#6b7280">
        No Image
      </text>
    </svg>
  `)}`,

  productDetail: `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <rect width="600" height="600" fill="#f3f4f6"/>
      <text x="300" y="300" text-anchor="middle" dominant-baseline="middle" 
            font-family="system-ui, sans-serif" font-size="24" fill="#6b7280">
        Product Image
      </text>
    </svg>
  `)}`,

  thumbnail: `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
      <rect width="80" height="80" fill="#f3f4f6"/>
      <text x="40" y="40" text-anchor="middle" dominant-baseline="middle" 
            font-family="system-ui, sans-serif" font-size="10" fill="#6b7280">
        Thumb
      </text>
    </svg>
  `)}`
};
