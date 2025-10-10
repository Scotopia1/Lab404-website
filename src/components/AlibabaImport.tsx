import { useState } from 'react';
import { Search, Download, Edit, Check, X, AlertCircle, CheckCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

interface AlibabaImportProps {
  onImport?: (product: ImportedProduct) => void;
}

const AlibabaImport = ({ onImport }: AlibabaImportProps) => {
  const [alibabaUrl, setAlibabaUrl] = useState('');
  const [scrapedData, setScrapedData] = useState<ScrapedProductData | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationStep, setValidationStep] = useState<'input' | 'preview' | 'edit'>('input');

  const handleScrape = async () => {
    if (!alibabaUrl.trim()) {
      setError('Please enter a valid Alibaba URL');
      return;
    }

    setIsScraping(true);
    setError(null);
    setScrapedData(null);

    try {
      // Use the API client to call the preview endpoint
      const result = await apiClient.previewAlibabaProduct(alibabaUrl);
      setScrapedData(result.preview);
      setValidationStep('preview');
    } catch (err: any) {
      setError(err.message || 'Failed to scrape Alibaba product');
    } finally {
      setIsScraping(false);
    }
  };

  const handleImport = async () => {
    if (!scrapedData) return;

    setIsImporting(true);
    setError(null);

    try {
      const importedProduct: ImportedProduct = {
        id: `imported_${Date.now()}`,
        name: scrapedData.name,
        description: scrapedData.description,
        price: scrapedData.price,
        compareAtPrice: scrapedData.compare_at_price,
        category: 'imported', // Default category
        images: scrapedData.images,
        specifications: Array.isArray(scrapedData.specifications)
          ? scrapedData.specifications
          : Object.entries(scrapedData.specifications || {}).map(([name, value]) => ({ name, value: String(value) })),
        features: scrapedData.features || [],
        brand: scrapedData.brand,
        tags: scrapedData.tags || [],
        inStock: true,
        featured: false,
        alibabaUrl: alibabaUrl,
        // Add other required fields with defaults
        costPrice: 0,
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

      if (onImport) {
        onImport(importedProduct);
      }

      // Reset state
      setScrapedData(null);
      setValidationStep('input');
      setAlibabaUrl('');

      alert(`Product "${scrapedData.name}" imported successfully!`);
    } catch (err: any) {
      setError(err.message || 'Failed to import product');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Import from Alibaba</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 1: URL Input */}
          {validationStep === 'input' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Alibaba Product URL</label>
                <div className="flex space-x-4">
                  <Input
                    placeholder="Paste Alibaba product URL here..."
                    value={alibabaUrl}
                    onChange={(e) => setAlibabaUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleScrape()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleScrape}
                    disabled={isScraping || !alibabaUrl.trim()}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {isScraping ? 'Scraping...' : 'Import'}
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  Enter a valid Alibaba product URL to automatically scrape product information including
                  name, description, images, specifications, and pricing data.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 2: Scraped Data Preview */}
          {validationStep === 'preview' && scrapedData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Scraped Product Data</h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    setValidationStep('input');
                    setScrapedData(null);
                    setError(null);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>

              {/* Validation Status */}
              <Card className={`border-l-4 ${scrapedData.validation.hasRequiredFields ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    {scrapedData.validation.hasRequiredFields ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <h4 className="font-semibold">
                      {scrapedData.validation.hasRequiredFields ? 'Ready to Import' : 'Missing Required Fields'}
                    </h4>
                  </div>

                  {!scrapedData.validation.hasRequiredFields && (
                    <div className="mb-3">
                      <p className="text-sm text-red-600 mb-2">Missing Required Fields:</p>
                      <div className="flex flex-wrap gap-2">
                        {scrapedData.validation.missingRequired.map((field) => (
                          <Badge key={field} variant="destructive" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-green-600 mb-2">Available Optional Fields:</p>
                    <div className="flex flex-wrap gap-2">
                      {scrapedData.validation.availableOptional.map((field) => (
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
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Images */}
                    <div>
                      {scrapedData.images.length > 0 && (
                        <img
                          src={scrapedData.images[0]}
                          alt={scrapedData.name}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                      )}
                      <p className="text-xs text-gray-500">
                        {scrapedData.images.length} images scraped
                      </p>
                    </div>

                    {/* Product Info */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-lg">{scrapedData.name}</h4>
                        <p className="text-gray-600 text-sm mt-2">{scrapedData.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Price</p>
                          <p className="text-lg font-bold text-green-600">${scrapedData.price}</p>
                        </div>
                        {scrapedData.compare_at_price && (
                          <div>
                            <p className="text-sm font-medium">Compare Price</p>
                            <p className="text-lg font-bold text-gray-500">${scrapedData.compare_at_price}</p>
                          </div>
                        )}
                      </div>

                      {scrapedData.brand && (
                        <div>
                          <p className="text-sm font-medium">Brand</p>
                          <p className="text-sm">{scrapedData.brand}</p>
                        </div>
                      )}

                      {scrapedData.features && scrapedData.features.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Features</p>
                          <div className="space-y-1">
                            {scrapedData.features.slice(0, 3).map((feature, index) => (
                              <p key={index} className="text-xs text-gray-600">• {feature}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Specifications */}
                  {scrapedData.specifications && Object.keys(scrapedData.specifications).length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <h5 className="font-medium mb-3">Specifications</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(scrapedData.specifications).slice(0, 6).map(([key, value], index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{key}:</span> {value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <Button
                  onClick={handleImport}
                  disabled={isImporting || !scrapedData.validation.hasRequiredFields}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isImporting ? 'Importing...' : 'Import to Product Form'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setValidationStep('input');
                    setScrapedData(null);
                    setAlibabaUrl('');
                  }}
                >
                  Import Different Product
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AlibabaImport;