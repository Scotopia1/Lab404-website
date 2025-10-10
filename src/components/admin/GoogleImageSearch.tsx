import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Image as ImageIcon,
  Check,
  Copy,
  Loader2,
  AlertCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Interfaces
interface GoogleImage {
  url: string;
  thumbnailUrl: string;
  title: string;
  width: number;
  height: number;
  size: number;
  fileType: string;
  contextUrl: string;
  source: string;
  aspectRatio: string;
  displaySize: string;
}

interface GoogleImageSearchResponse {
  images: GoogleImage[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  };
  searchInfo: {
    query: string;
    searchTime: number;
    totalResults: number;
  };
}

interface GoogleImageSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectImages: (imageUrls: string[]) => void;
  multiSelect?: boolean;
  maxSelections?: number;
  initialQuery?: string;
}

export const GoogleImageSearch: React.FC<GoogleImageSearchProps> = ({
  open,
  onOpenChange,
  onSelectImages,
  multiSelect = false,
  maxSelections = 10,
  initialQuery = '',
}) => {
  // State management
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    imageSize: 'medium' as 'icon' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'huge',
    imageType: 'photo' as 'clipart' | 'face' | 'lineart' | 'stock' | 'photo' | 'animated',
    fileType: '' as '' | 'jpg' | 'png' | 'gif' | 'bmp' | 'svg' | 'webp' | 'ico',
    safeSearch: 'active' as 'active' | 'off',
  });

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setCurrentPage(1); // Reset to page 1 when query changes
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // Calculate pagination offset
  const limit = 10;
  const offset = (currentPage - 1) * limit;

  // Fetch images from API
  const {
    data: searchData,
    isLoading,
    error,
    refetch,
  } = useQuery<GoogleImageSearchResponse>({
    queryKey: [
      'google-images',
      debouncedQuery,
      currentPage,
      filters.imageSize,
      filters.imageType,
      filters.fileType,
    ],
    queryFn: async () => {
      const params: Record<string, any> = {
        query: debouncedQuery,
        limit,
        start: offset,
        imageSize: filters.imageSize,
        imageType: filters.imageType,
        safeSearch: filters.safeSearch,
      };

      if (filters.fileType) {
        params.fileType = filters.fileType;
      }

      const response = await apiClient.get<{ data: GoogleImageSearchResponse }>(
        '/admin/google-images/search',
        params
      );

      return response.data;
    },
    enabled: !!debouncedQuery && debouncedQuery.length >= 2,
    keepPreviousData: true,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handlers
  const handleToggleImage = useCallback(
    (imageUrl: string) => {
      setSelectedImages((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(imageUrl)) {
          newSet.delete(imageUrl);
        } else {
          if (!multiSelect) {
            newSet.clear();
          }
          if (multiSelect && newSet.size >= maxSelections) {
            toast.error(`Maximum ${maxSelections} images allowed`);
            return prev;
          }
          newSet.add(imageUrl);
        }
        return newSet;
      });
    },
    [multiSelect, maxSelections]
  );

  const handleCopyUrl = useCallback((url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    toast.success('Image URL copied to clipboard');
  }, []);

  const handleSelectImages = useCallback(() => {
    if (selectedImages.size === 0) {
      toast.error('Please select at least one image');
      return;
    }
    onSelectImages(Array.from(selectedImages));
    setSelectedImages(new Set());
    setQuery('');
    setDebouncedQuery('');
    onOpenChange(false);
  }, [selectedImages, onSelectImages, onOpenChange]);

  const handleClearSelection = useCallback(() => {
    setSelectedImages(new Set());
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Computed values
  const images = searchData?.images || [];
  const pagination = searchData?.pagination;
  const searchInfo = searchData?.searchInfo;

  // Error handling
  const isQuotaExceeded = error?.message?.includes('quota') || error?.message?.includes('limit');
  const isNetworkError = error?.message?.includes('network') || error?.message?.includes('fetch');

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Search Google Images
          </DialogTitle>
          <DialogDescription>
            Search and select images from Google. {multiSelect ? `Select up to ${maxSelections} images.` : 'Select one image.'}
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="p-6 pb-4 border-b space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for images..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => {
                  setQuery('');
                  setDebouncedQuery('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Size</Label>
              <Select
                value={filters.imageSize}
                onValueChange={(value: any) =>
                  setFilters((prev) => ({ ...prev, imageSize: value }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="icon">Icon</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="xlarge">Extra Large</SelectItem>
                  <SelectItem value="xxlarge">XXL</SelectItem>
                  <SelectItem value="huge">Huge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select
                value={filters.imageType}
                onValueChange={(value: any) =>
                  setFilters((prev) => ({ ...prev, imageType: value }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo">Photo</SelectItem>
                  <SelectItem value="clipart">Clipart</SelectItem>
                  <SelectItem value="lineart">Line Art</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="face">Face</SelectItem>
                  <SelectItem value="animated">Animated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Format</Label>
              <Select
                value={filters.fileType}
                onValueChange={(value: any) =>
                  setFilters((prev) => ({ ...prev, fileType: value }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All formats</SelectItem>
                  <SelectItem value="jpg">JPG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="gif">GIF</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                  <SelectItem value="svg">SVG</SelectItem>
                  <SelectItem value="bmp">BMP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Safe Search</Label>
              <Select
                value={filters.safeSearch}
                onValueChange={(value: any) =>
                  setFilters((prev) => ({ ...prev, safeSearch: value }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Info */}
          {searchInfo && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                Found {searchInfo.totalResults.toLocaleString()} results in{' '}
                {searchInfo.searchTime.toFixed(2)}s
              </span>
              {selectedImages.size > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Check className="h-3 w-3" />
                  {selectedImages.size} selected
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Image Grid */}
        <ScrollArea className="h-[450px] px-6">
          <div className="py-4">
            {/* Empty State - No Query */}
            {!debouncedQuery && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Enter a search query to find images
                </p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && debouncedQuery && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="aspect-square rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* Error States */}
            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-3" />
                <p className="font-medium text-destructive mb-1">
                  {isQuotaExceeded
                    ? 'API Quota Exceeded'
                    : isNetworkError
                    ? 'Network Error'
                    : 'Search Failed'}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {isQuotaExceeded
                    ? 'The Google Images API daily quota has been exceeded. Please try again tomorrow.'
                    : isNetworkError
                    ? 'Unable to connect to the search service. Please check your connection.'
                    : 'An error occurred while searching for images. Please try again.'}
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Try Again
                </Button>
              </div>
            )}

            {/* Empty Results */}
            {!isLoading && !error && debouncedQuery && images.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="font-medium mb-1">No images found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search query or filters
                </p>
              </div>
            )}

            {/* Image Grid */}
            {!isLoading && !error && images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {images.map((image, index) => {
                    const isSelected = selectedImages.has(image.url);
                    const isHovered = hoveredImage === image.url;

                    return (
                      <motion.div
                        key={`${image.url}-${index}`}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="group relative"
                      >
                        <button
                          onClick={() => handleToggleImage(image.url)}
                          onMouseEnter={() => setHoveredImage(image.url)}
                          onMouseLeave={() => setHoveredImage(null)}
                          className={cn(
                            'relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all',
                            isSelected
                              ? 'border-primary ring-2 ring-primary ring-offset-2'
                              : 'border-transparent hover:border-muted-foreground/20'
                          )}
                        >
                          <img
                            src={image.thumbnailUrl}
                            alt={image.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />

                          {/* Selection Overlay */}
                          <div
                            className={cn(
                              'absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity',
                              isSelected || isHovered ? 'opacity-100' : 'opacity-0'
                            )}
                          >
                            {isSelected && (
                              <div className="bg-primary text-primary-foreground rounded-full p-2">
                                <Check className="h-5 w-5" />
                              </div>
                            )}
                          </div>

                          {/* Copy Button */}
                          {isHovered && !isSelected && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="absolute top-2 right-2 h-8 w-8 p-0"
                              onClick={(e) => handleCopyUrl(image.url, e)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </button>

                        {/* Image Info */}
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium line-clamp-1" title={image.title}>
                            {image.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{image.displaySize}</span>
                            <span>•</span>
                            <span className="uppercase">{image.fileType}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && !isLoading && !error && (
          <div className="border-t px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination || currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination || !pagination.hasMore}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="border-t px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {selectedImages.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="text-muted-foreground"
                >
                  Clear Selection
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSelectImages}
                disabled={selectedImages.size === 0}
              >
                <Check className="h-4 w-4 mr-2" />
                Select {selectedImages.size > 0 ? `(${selectedImages.size})` : ''}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
