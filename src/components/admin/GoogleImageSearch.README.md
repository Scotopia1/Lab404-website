# GoogleImageSearch Component

A comprehensive React component for searching and selecting images from Google Images within the LAB404 admin panel.

## Features

- **Debounced Search**: 500ms delay prevents excessive API calls while typing
- **Advanced Filters**: Size, type, format, and safe search options
- **Infinite Scroll/Pagination**: Navigate through large result sets
- **Multi-Select Support**: Select single or multiple images
- **Image Metadata Display**: Shows dimensions, file size, and format
- **Loading States**: Skeleton loaders during search
- **Error Handling**: Quota exceeded, network errors, and empty states
- **Copy to Clipboard**: Quick URL copying functionality
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Navigation**: Accessible keyboard shortcuts

## Installation

The component is already installed in the project. Required dependencies:

```json
{
  "@tanstack/react-query": "^5.x",
  "framer-motion": "^11.x",
  "lucide-react": "^0.x",
  "sonner": "^1.x"
}
```

## Usage

### Basic Example

```tsx
import { useState } from 'react';
import { GoogleImageSearch } from '@/components/admin/GoogleImageSearch';
import { Button } from '@/components/ui/button';

function MyComponent() {
  const [showSearch, setShowSearch] = useState(false);

  const handleImagesSelected = (imageUrls: string[]) => {
    console.log('Selected images:', imageUrls);
    // Do something with the selected image URLs
  };

  return (
    <>
      <Button onClick={() => setShowSearch(true)}>
        Search Images
      </Button>

      <GoogleImageSearch
        open={showSearch}
        onOpenChange={setShowSearch}
        onSelectImages={handleImagesSelected}
      />
    </>
  );
}
```

### Advanced Example (Product Management)

```tsx
import { useState } from 'react';
import { GoogleImageSearch } from '@/components/admin/GoogleImageSearch';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon } from 'lucide-react';

function ProductForm() {
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productName, setProductName] = useState('');

  const handleGoogleImagesSelected = (imageUrls: string[]) => {
    setProductImages(prev => [...prev, ...imageUrls]);
  };

  return (
    <div>
      <div className="space-y-2">
        <label>Product Name</label>
        <input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label>Product Images</label>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowImageSearch(true)}
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Search Google Images
        </Button>

        {/* Display selected images */}
        <div className="grid grid-cols-4 gap-2">
          {productImages.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Product ${index + 1}`}
              className="aspect-square object-cover rounded border"
            />
          ))}
        </div>
      </div>

      <GoogleImageSearch
        open={showImageSearch}
        onOpenChange={setShowImageSearch}
        onSelectImages={handleGoogleImagesSelected}
        multiSelect={true}
        maxSelections={10}
        initialQuery={productName} // Pre-fill with product name
      />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | **Required** | Controls dialog visibility |
| `onOpenChange` | `(open: boolean) => void` | **Required** | Callback when dialog state changes |
| `onSelectImages` | `(imageUrls: string[]) => void` | **Required** | Callback with selected image URLs |
| `multiSelect` | `boolean` | `false` | Enable multiple image selection |
| `maxSelections` | `number` | `10` | Maximum number of images to select (multi-select only) |
| `initialQuery` | `string` | `''` | Pre-fill search query |

## API Integration

### Backend Endpoint

The component expects a backend endpoint at:

```
GET /api/admin/google-images/search
```

### Request Parameters

```typescript
{
  query: string;           // Search query
  limit: number;           // Results per page (default: 10)
  start: number;           // Pagination offset
  imageSize?: string;      // 'icon' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'huge'
  imageType?: string;      // 'clipart' | 'face' | 'lineart' | 'stock' | 'photo' | 'animated'
  fileType?: string;       // 'jpg' | 'png' | 'gif' | 'bmp' | 'svg' | 'webp' | 'ico'
  safeSearch?: string;     // 'active' | 'off'
}
```

### Response Format

```typescript
{
  data: {
    images: [
      {
        url: string;              // Full-size image URL
        thumbnailUrl: string;     // Thumbnail URL
        title: string;            // Image title/alt text
        width: number;            // Image width in pixels
        height: number;           // Image height in pixels
        size: number;             // File size in bytes
        fileType: string;         // File format (jpg, png, etc.)
        contextUrl: string;       // Source page URL
        source: string;           // Source domain
        aspectRatio: string;      // e.g., "16:9", "4:3"
        displaySize: string;      // e.g., "1920x1080"
      }
    ],
    pagination: {
      total: number;              // Total results found
      limit: number;              // Results per page
      offset: number;             // Current offset
      page: number;               // Current page number
      totalPages: number;         // Total pages available
      hasMore: boolean;           // More results available
    },
    searchInfo: {
      query: string;              // Original search query
      searchTime: number;         // Search execution time (seconds)
      totalResults: number;       // Total matching results
    }
  }
}
```

## Features in Detail

### 1. Search with Debouncing

- 500ms delay prevents excessive API calls
- Automatic search trigger when typing stops
- Visual loading indicators during search

### 2. Advanced Filters

**Image Size:**
- Icon: < 400x300
- Small: 400x300 - 640x480
- Medium: 640x480 - 1024x768
- Large: 1024x768 - 2048x1536
- XLarge, XXLarge, Huge: Progressively larger

**Image Type:**
- Photo: Photographs
- Clipart: Clip art images
- Line Art: Line drawings
- Stock: Stock photography
- Face: Images with faces
- Animated: GIFs and animations

**File Format:**
- JPG, PNG, GIF, WebP, SVG, BMP, ICO

**Safe Search:**
- Active: Filter explicit content
- Off: No filtering

### 3. Selection Modes

**Single Select (`multiSelect={false}`):**
- Click to select one image
- Previous selection is cleared
- Useful for product featured images

**Multi-Select (`multiSelect={true}`):**
- Click to toggle selection
- Maximum limit enforced (`maxSelections`)
- Visual selection counter
- Useful for product galleries

### 4. Loading States

**Skeleton Loaders:**
- 8 skeleton cards displayed during initial search
- Smooth transition to actual results
- Maintains layout stability

**Empty States:**
- No query entered: Helpful prompt
- No results found: Suggestions to refine search
- Search in progress: Loading animation

### 5. Error Handling

**Quota Exceeded:**
- Displays helpful error message
- Explains daily quota limits
- Suggests trying again tomorrow

**Network Errors:**
- Connection issue detection
- Retry functionality
- Clear error messaging

**API Errors:**
- Backend error display
- Graceful degradation
- User-friendly messages

### 6. Pagination

- Previous/Next buttons
- Current page indicator
- Smooth page transitions
- Maintains filter state

### 7. Image Metadata

Each image card displays:
- Thumbnail preview
- Image title
- Dimensions (width x height)
- File format (JPG, PNG, etc.)

Hover state shows:
- Copy URL button
- Selection overlay
- Enlarged preview

## Styling

The component uses Tailwind CSS and shadcn/ui components for consistent styling:

```tsx
// Custom styling example
<GoogleImageSearch
  open={open}
  onOpenChange={setOpen}
  onSelectImages={handleSelect}
  className="custom-dialog" // Won't work - DialogContent needs modification
/>
```

To customize styles, modify the component directly or wrap it in a custom container.

## Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- Focus management
- Semantic HTML structure
- Alt text for images

## Performance Optimization

1. **Debounced Search**: Reduces API calls
2. **Lazy Loading**: Images load as needed
3. **Query Caching**: TanStack Query caches results (5 minutes)
4. **Keep Previous Data**: Smooth pagination transitions
5. **Optimized Re-renders**: React.memo and useCallback

## Error States

### Quota Exceeded
```
"API Quota Exceeded"
"The Google Images API daily quota has been exceeded. Please try again tomorrow."
```

### Network Error
```
"Network Error"
"Unable to connect to the search service. Please check your connection."
```

### No Results
```
"No images found"
"Try adjusting your search query or filters"
```

## Best Practices

1. **Pre-fill Search Query**: Use product name or relevant context
   ```tsx
   <GoogleImageSearch
     initialQuery={productName}
     // ... other props
   />
   ```

2. **Limit Selections**: Set reasonable limits for performance
   ```tsx
   <GoogleImageSearch
     multiSelect={true}
     maxSelections={5}
     // ... other props
   />
   ```

3. **Handle Selection**: Process selected images appropriately
   ```tsx
   const handleImagesSelected = async (imageUrls: string[]) => {
     // Download and re-host images on your server
     const rehostedUrls = await Promise.all(
       imageUrls.map(url => uploadImageFromUrl(url))
     );
     setProductImages(prev => [...prev, ...rehostedUrls]);
   };
   ```

4. **Error Recovery**: Provide fallback options
   ```tsx
   const handleImagesSelected = (imageUrls: string[]) => {
     try {
       processImages(imageUrls);
     } catch (error) {
       toast.error('Failed to add images. Please try manual upload.');
     }
   };
   ```

## Common Issues

### 1. API Quota Exceeded

**Problem**: Too many API requests in 24 hours

**Solution**:
- Implement backend caching
- Use CDN for frequently searched images
- Consider alternative image sources

### 2. CORS Errors

**Problem**: Cannot load images from external domains

**Solution**:
- Download and rehost images on your server
- Use image proxy service
- Configure CORS headers on backend

### 3. Slow Search Performance

**Problem**: Search takes too long

**Solution**:
- Implement backend caching
- Reduce result limit
- Add loading indicators

## TypeScript Support

Full TypeScript support with proper type definitions:

```typescript
import type { GoogleImage, GoogleImageSearchResponse } from './GoogleImageSearch';
```

## Browser Support

- Chrome: ✅ Latest 2 versions
- Firefox: ✅ Latest 2 versions
- Safari: ✅ Latest 2 versions
- Edge: ✅ Latest 2 versions
- Mobile: ✅ iOS Safari, Chrome Android

## License

Part of the LAB404 e-commerce platform.

## Related Components

- `OptimizedImage`: Optimized image display component
- `ImageUploader`: Direct file upload component
- `ProductManagement`: Product form integration

## Support

For issues or questions, contact the development team or check the project documentation.
