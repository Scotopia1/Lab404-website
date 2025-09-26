import { useState, useRef, useCallback } from 'react';
import { Search, Download, Edit, Check, X, AlertCircle, CheckCircle, Upload,
         Eye, Zap, Calculator, RefreshCw, ExternalLink, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImportedProduct } from '@/lib/types';
import { apiClient } from '@/api/client';

interface ScrapedProductData {
  name: string;
  description: string;
  price: number;
  compare_at_price?: number;
  brand?: string;
  images: string[];
  specifications?: Record<string, any>;
  features?: string[];
  tags?: string[];
  validation: {
    hasRequiredFields: boolean;
    missingRequired: string[];
    availableOptional: string[];
  };
}

interface EditableProductData extends ScrapedProductData {
  category?: string;
  markup_percentage?: number;
  final_price?: number;
}

const AlibabaImportPreview = () => {
  const [alibabaUrl, setAlibabaUrl] = useState('');
  const [scrapedData, setScrapedData] = useState<ScrapedProductData | null>(null);
  const [editableData, setEditableData] = useState<EditableProductData | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationStep, setValidationStep] = useState<'input' | 'preview' | 'edit'>('input');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    resetTime: number;
    isLimited: boolean;
  } | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastRequestTimeRef = useRef<number>(0);

  // Enhanced error handling for rate limits
  const handleApiError = (err: any) => {
    if (err.status === 429) {
      const retryAfter = err.headers?.get('retry-after') || err.retryAfter || 60;
      const resetTime = Date.now() + (retryAfter * 1000);

      setRateLimitInfo({
        remaining: 0,
        resetTime,
        isLimited: true
      });

      setRetryCountdown(retryAfter);

      // Start countdown timer
      const countdownInterval = setInterval(() => {
        setRetryCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setRateLimitInfo(prev => prev ? { ...prev, isLimited: false } : null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setError(`Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
    } else {
      setError(err.message || 'Failed to scrape Alibaba product');
    }
  };

  // Debounced scrape function
  const handleScrape = useCallback(async () => {
    if (!alibabaUrl.trim()) {
      setError('Please enter a valid Alibaba URL');
      return;
    }

    // Debounce: prevent requests faster than 2 seconds apart
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    const minDelay = 2000; // 2 seconds

    if (timeSinceLastRequest < minDelay) {
      setError(`Please wait ${Math.ceil((minDelay - timeSinceLastRequest) / 1000)} seconds before trying again`);
      return;
    }

    // Check if we're currently rate limited
    if (rateLimitInfo?.isLimited) {
      setError(`Rate limited. Please wait ${retryCountdown} seconds.`);
      return;
    }

    lastRequestTimeRef.current = now;
    setIsScraping(true);
    setError(null);
    setScrapedData(null);
    setEditableData(null);

    try {
      const result = await apiClient.previewAlibabaProduct(alibabaUrl);

      // Update rate limit info from response headers
      const remaining = parseInt(result.headers?.get('x-ratelimit-remaining') || '0');
      const resetTime = parseInt(result.headers?.get('x-ratelimit-reset') || '0') * 1000;

      if (remaining !== undefined && resetTime) {
        setRateLimitInfo({
          remaining,
          resetTime,
          isLimited: false
        });
      }

      setScrapedData(result.preview);
      setEditableData({
        ...result.preview,
        markup_percentage: 30, // Default 30% markup
        final_price: result.preview.price * 1.3,
        category: 'Electronics' // Default category
      });
      setValidationStep('preview');
      setSelectedImageIndex(0);

      // Scroll to preview section
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setIsScraping(false);
    }
  }, [alibabaUrl, rateLimitInfo?.isLimited, retryCountdown]);

  const handleEdit = () => {
    setValidationStep('edit');
  };

  const handleMarkupChange = (markup: number) => {
    if (editableData) {
      const finalPrice = editableData.price * (1 + markup / 100);
      setEditableData({
        ...editableData,
        markup_percentage: markup,
        final_price: finalPrice
      });
    }
  };

  const handleImport = async () => {
    if (!editableData) return;

    setIsImporting(true);
    setError(null);

    try {
      const importedProduct: ImportedProduct = {
        id: `imported_${Date.now()}`,
        name: editableData.name,
        description: editableData.description,
        price: editableData.final_price || editableData.price,
        compareAtPrice: editableData.compare_at_price,
        category: editableData.category || 'imported',
        images: editableData.images,
        specifications: Array.isArray(editableData.specifications)
          ? editableData.specifications
          : Object.entries(editableData.specifications || {}).map(([name, value]) => ({ name, value: String(value) })),
        features: editableData.features || [],
        brand: editableData.brand,
        tags: editableData.tags || [],
        inStock: true,
        featured: false,
        alibabaUrl: alibabaUrl,
        costPrice: editableData.price,
        sku: '',
        barcode: '',
        weight: 0,
        dimensions: { width: 0, height: 0, depth: 0 },
        categoryId: '',
        videos: [],
        stockQuantity: 999999,
        lowStockThreshold: 10,
        trackInventory: false,
        slug: '',
        metaTitle: '',
        metaDescription: '',
        isActive: true,
        isDigital: false,
        requiresShipping: true,
        supplierId: '',
        supplierSku: '',
        rating: 0,
        reviewCount: 0
      };

      // Note: This component is for preview only - actual import is handled by ContentImportManager
      // Future enhancement: Add direct import functionality here if needed

      // Reset state
      setScrapedData(null);
      setEditableData(null);
      setValidationStep('input');
      setAlibabaUrl('');

      alert(`Product "${editableData.name}" imported successfully!`);
    } catch (err: any) {
      setError(err.message || 'Failed to import product');
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setScrapedData(null);
    setEditableData(null);
    setValidationStep('input');
    setAlibabaUrl('');
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* URL Input Section */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Import from Alibaba</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="alibaba-url" className="text-base font-medium">
                Alibaba Product URL
              </Label>
              <div className="flex space-x-4 mt-2">
                <Input
                  id="alibaba-url"
                  placeholder="https://www.alibaba.com/product-detail/..."
                  value={alibabaUrl}
                  onChange={(e) => setAlibabaUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleScrape()}
                  className="flex-1 text-base"
                />
                <Button
                  onClick={handleScrape}
                  disabled={isScraping || !alibabaUrl.trim() || rateLimitInfo?.isLimited}
                  size="lg"
                  className="px-8"
                >
                  {isScraping ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Scraping...
                    </>
                  ) : rateLimitInfo?.isLimited ? (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Wait {retryCountdown}s
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Preview
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Paste any Alibaba product URL to automatically extract product information including
                name, description, images, specifications, and pricing data.
              </AlertDescription>
            </Alert>

            {/* Rate Limit Info */}
            {rateLimitInfo && (
              <Alert className={rateLimitInfo.isLimited ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
                <AlertCircle className={`h-4 w-4 ${rateLimitInfo.isLimited ? "text-orange-600" : "text-green-600"}`} />
                <AlertDescription className={rateLimitInfo.isLimited ? "text-orange-700" : "text-green-700"}>
                  {rateLimitInfo.isLimited ? (
                    <>Rate limit active. You can try again in {retryCountdown} seconds.</>
                  ) : (
                    <>Rate limit: {rateLimitInfo.remaining} requests remaining this minute.</>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Preview Section */}
      {(validationStep === 'preview' || validationStep === 'edit') && editableData && (
        <div ref={scrollRef} className="space-y-6">
          {/* Validation Status */}
          <Card className={`border-l-4 ${editableData.validation.hasRequiredFields ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {editableData.validation.hasRequiredFields ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <h4 className="font-semibold">
                    {editableData.validation.hasRequiredFields ? 'Ready to Import' : 'Missing Required Fields'}
                  </h4>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                >
                  <X className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
              </div>

              {!editableData.validation.hasRequiredFields && (
                <div className="mb-3">
                  <p className="text-sm text-red-600 mb-2">Missing Required Fields:</p>
                  <div className="flex flex-wrap gap-2">
                    {editableData.validation.missingRequired.map((field) => (
                      <Badge key={field} variant="destructive" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-green-600 mb-2">Available Fields:</p>
                <div className="flex flex-wrap gap-2">
                  {editableData.validation.availableOptional.map((field) => (
                    <Badge key={field} variant="outline" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Product Preview
                </CardTitle>
                <div className="flex gap-2">
                  {validationStep === 'preview' && (
                    <Button variant="outline" onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Details
                    </Button>
                  )}
                  {validationStep === 'edit' && (
                    <Button variant="outline" onClick={() => setValidationStep('preview')}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Mode
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="images">Images ({editableData.images.length})</TabsTrigger>
                  <TabsTrigger value="specs">Specifications</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      {validationStep === 'edit' ? (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-name">Product Name</Label>
                            <Input
                              id="edit-name"
                              value={editableData.name}
                              onChange={(e) => setEditableData({...editableData, name: e.target.value})}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                              id="edit-description"
                              value={editableData.description}
                              onChange={(e) => setEditableData({...editableData, description: e.target.value})}
                              rows={4}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-category">Category</Label>
                            <Input
                              id="edit-category"
                              value={editableData.category || ''}
                              onChange={(e) => setEditableData({...editableData, category: e.target.value})}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-brand">Brand</Label>
                            <Input
                              id="edit-brand"
                              value={editableData.brand || ''}
                              onChange={(e) => setEditableData({...editableData, brand: e.target.value})}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-xl">{editableData.name}</h4>
                            <p className="text-gray-600 mt-2 leading-relaxed">{editableData.description}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {editableData.category && (
                              <div>
                                <p className="text-sm font-medium text-gray-500">Category</p>
                                <p className="text-sm">{editableData.category}</p>
                              </div>
                            )}
                            {editableData.brand && (
                              <div>
                                <p className="text-sm font-medium text-gray-500">Brand</p>
                                <p className="text-sm">{editableData.brand}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Features */}
                      {editableData.features && editableData.features.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-3">Key Features</h5>
                          <div className="space-y-2">
                            {editableData.features.slice(0, 5).map((feature, index) => (
                              <div key={index} className="flex items-start space-x-2">
                                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-gray-700">{feature}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Main Image */}
                    <div>
                      {editableData.images.length > 0 && (
                        <div className="space-y-4">
                          <div
                            className="relative cursor-pointer group"
                            onClick={() => setShowImageDialog(true)}
                          >
                            <img
                              src={editableData.images[selectedImageIndex]}
                              alt={editableData.name}
                              className="w-full h-64 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>

                          {/* Image Thumbnails */}
                          {editableData.images.length > 1 && (
                            <div className="flex space-x-2 overflow-x-auto">
                              {editableData.images.map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`${editableData.name} ${index + 1}`}
                                  className={`w-16 h-16 object-cover rounded cursor-pointer flex-shrink-0 border-2 transition-all ${
                                    selectedImageIndex === index
                                      ? 'border-blue-500 shadow-md'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                  onClick={() => setSelectedImageIndex(index)}
                                />
                              ))}
                            </div>
                          )}

                          <p className="text-xs text-gray-500 text-center">
                            {editableData.images.length} image{editableData.images.length !== 1 ? 's' : ''} available
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Images Tab */}
                <TabsContent value="images">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {editableData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`${editableData.name} ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => {
                            setSelectedImageIndex(index);
                            setShowImageDialog(true);
                          }}
                        />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Specifications Tab */}
                <TabsContent value="specs">
                  {editableData.specifications && Object.keys(editableData.specifications).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(editableData.specifications).map(([key, value], index) => (
                        <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                          <span className="font-medium text-gray-700">{key}</span>
                          <span className="text-gray-600">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No specifications available
                    </div>
                  )}
                </TabsContent>

                {/* Pricing Tab */}
                <TabsContent value="pricing">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-500">Original Price</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold text-gray-900">${editableData.price.toFixed(2)}</p>
                        </CardContent>
                      </Card>

                      {validationStep === 'edit' ? (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-gray-500">Markup %</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Input
                              type="number"
                              value={editableData.markup_percentage || 30}
                              onChange={(e) => handleMarkupChange(Number(e.target.value))}
                              className="text-xl font-bold"
                            />
                          </CardContent>
                        </Card>
                      ) : (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-gray-500">Markup</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold text-blue-600">
                              {editableData.markup_percentage || 30}%
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-500">Final Price</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold text-green-600">
                            ${(editableData.final_price || editableData.price).toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calculator className="h-4 w-4" />
                      <span>
                        Profit margin: ${((editableData.final_price || editableData.price) - editableData.price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleImport}
              disabled={isImporting || !editableData.validation.hasRequiredFields}
              size="lg"
              className="px-8 bg-green-600 hover:bg-green-700"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Import Product
                </>
              )}
            </Button>

            <Button variant="outline" size="lg" onClick={resetForm}>
              Import Different Product
            </Button>
          </div>
        </div>
      )}

      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Product Images</DialogTitle>
          </DialogHeader>
          {editableData && (
            <div className="space-y-4">
              <img
                src={editableData.images[selectedImageIndex]}
                alt={editableData.name}
                className="w-full h-96 object-contain rounded-lg"
              />
              <div className="flex justify-center space-x-2">
                {editableData.images.map((_, index) => (
                  <Button
                    key={index}
                    variant={selectedImageIndex === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlibabaImportPreview;