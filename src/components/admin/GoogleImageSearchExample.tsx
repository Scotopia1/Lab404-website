/**
 * Example usage of GoogleImageSearch component
 *
 * This file demonstrates how to integrate the Google Image Search dialog
 * into your product management or any other admin component.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GoogleImageSearch } from './GoogleImageSearch';
import { Image as ImageIcon } from 'lucide-react';

export const GoogleImageSearchExample: React.FC = () => {
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);

  const handleSelectImages = (imageUrls: string[]) => {
    console.log('Selected images:', imageUrls);
    setSelectedImageUrls((prev) => [...prev, ...imageUrls]);
  };

  return (
    <div className="space-y-4">
      {/* Trigger Button */}
      <Button onClick={() => setShowImageSearch(true)} variant="outline">
        <ImageIcon className="h-4 w-4 mr-2" />
        Search Google Images
      </Button>

      {/* Selected Images Preview */}
      {selectedImageUrls.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Selected Images:</h3>
          <div className="grid grid-cols-4 gap-2">
            {selectedImageUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Selected ${index + 1}`}
                className="aspect-square object-cover rounded-lg border"
              />
            ))}
          </div>
        </div>
      )}

      {/* Google Image Search Dialog */}
      <GoogleImageSearch
        open={showImageSearch}
        onOpenChange={setShowImageSearch}
        onSelectImages={handleSelectImages}
        multiSelect={true}
        maxSelections={5}
        initialQuery="arduino microcontroller"
      />
    </div>
  );
};

/**
 * Integration into ProductManagement.tsx
 *
 * Add this to the image upload section of your product form:
 *
 * ```tsx
 * // Add state for image search dialog
 * const [showImageSearch, setShowImageSearch] = useState(false);
 *
 * // Handler for image selection
 * const handleGoogleImagesSelected = (imageUrls: string[]) => {
 *   setFormData(prev => ({
 *     ...prev,
 *     images: [...prev.images, ...imageUrls]
 *   }));
 * };
 *
 * // Add button in the image upload section
 * <div className="flex items-center gap-2">
 *   <Label htmlFor="image-upload">Product Images</Label>
 *   <Button
 *     type="button"
 *     variant="outline"
 *     size="sm"
 *     onClick={() => setShowImageSearch(true)}
 *   >
 *     <ImageIcon className="h-4 w-4 mr-2" />
 *     Search Google Images
 *   </Button>
 * </div>
 *
 * // Add the dialog component
 * <GoogleImageSearch
 *   open={showImageSearch}
 *   onOpenChange={setShowImageSearch}
 *   onSelectImages={handleGoogleImagesSelected}
 *   multiSelect={true}
 *   maxSelections={10}
 *   initialQuery={formData.name} // Pre-fill with product name
 * />
 * ```
 */

/**
 * Props Reference:
 *
 * @param open - Controls dialog visibility
 * @param onOpenChange - Callback when dialog open state changes
 * @param onSelectImages - Callback when images are selected (receives array of image URLs)
 * @param multiSelect - Allow multiple image selection (default: false)
 * @param maxSelections - Maximum number of images that can be selected (default: 10)
 * @param initialQuery - Pre-fill search query (optional)
 */
