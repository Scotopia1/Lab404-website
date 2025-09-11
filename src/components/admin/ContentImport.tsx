import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Import, 
  Eye, 
  Settings, 
  Check, 
  X, 
  Loader2, 
  Package, 
  Star,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  ImageIcon,
  Tag,
  DollarSign,
  ShoppingBag,
  BarChart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

import { 
  alibabaContentAPI, 
  AlibabaProductContent, 
  AlibabaSearchResult,
  ContentImportOptions 
} from '@/lib/alibaba/AlibabaContentAPI';
import { contentImportManager, ImportRecord } from '@/lib/alibaba/ContentImportManager';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface ContentImportProps {
  onImportSuccess?: (productId: string) => void;
}

export const ContentImport: React.FC<ContentImportProps> = ({ onImportSuccess }) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AlibabaSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Import state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importOptions, setImportOptions] = useState<ContentImportOptions>({
    priceMarkup: 1.5, // 50% markup default
    addTags: ['imported']
  });

  // UI state
  const [previewProduct, setPreviewProduct] = useState<AlibabaProductContent | null>(null);
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'history' | 'stats'>('search');

  // Import history and stats
  const [importHistory, setImportHistory] = useState<ImportRecord[]>([]);
  const [importStats, setImportStats] = useState(contentImportManager.getImportStats());

  // Categories for import
  const categories = [
    'smartphones', 'laptops', 'accessories', 'gaming', 
    'electronics', 'audio', 'cameras', 'wearables'
  ];

  // Load import data on mount
  useEffect(() => {
    refreshImportData();
  }, []);

  const refreshImportData = useCallback(() => {
    setImportHistory(contentImportManager.getImportHistory());
    setImportStats(contentImportManager.getImportStats());
  }, []);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await alibabaContentAPI.searchProductContent(searchQuery, {
        page: 1,
        limit: 20
      });
      
      setSearchResults(results);
      
      if (results.products.length === 0) {
        toast.info('No products found. Try different keywords.');
      } else {
        toast.success(`Found ${results.products.length} products`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setSearchError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Handle product selection
  const toggleProductSelection = useCallback((productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  }, [selectedProducts]);

  // Handle single product import
  const handleImportSingle = useCallback(async (product: AlibabaProductContent) => {
    // Check if already imported
    const existing = contentImportManager.isAlreadyImported(product.id);
    if (existing) {
      toast.error(`Product "${product.title}" was already imported on ${new Date(existing.importedAt).toLocaleDateString()}`);
      return;
    }

    setIsImporting(true);
    
    try {
      const result = await contentImportManager.importProduct(product, importOptions);
      
      if (result.success) {
        toast.success(`✅ Successfully imported "${product.title}"`);
        refreshImportData();
        onImportSuccess?.(result.product?.id || '');
      } else {
        toast.error(`❌ Import failed: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      toast.error(`Import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  }, [importOptions, onImportSuccess, refreshImportData]);

  // Handle bulk import
  const handleBulkImport = useCallback(async () => {
    if (selectedProducts.size === 0) {
      toast.error('Please select products to import');
      return;
    }

    if (!searchResults) return;

    const productsToImport = searchResults.products.filter(p => selectedProducts.has(p.id));
    
    // Check for already imported products
    const alreadyImported = productsToImport.filter(p => 
      contentImportManager.isAlreadyImported(p.id)
    );
    
    if (alreadyImported.length > 0) {
      const shouldContinue = confirm(
        `${alreadyImported.length} product(s) were already imported. Continue with remaining products?`
      );
      if (!shouldContinue) return;
    }

    setIsImporting(true);

    try {
      const result = await contentImportManager.bulkImport(productsToImport, importOptions);
      
      if (result.successCount > 0) {
        toast.success(`✅ Successfully imported ${result.successCount} products`);
      }
      
      if (result.failureCount > 0) {
        toast.error(`❌ Failed to import ${result.failureCount} products`);
      }

      setSelectedProducts(new Set());
      refreshImportData();
      
      // Notify about successful imports
      result.successful.forEach(r => {
        if (r.product) {
          onImportSuccess?.(r.product.id);
        }
      });
      
    } catch (error) {
      toast.error(`Bulk import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  }, [selectedProducts, searchResults, importOptions, onImportSuccess, refreshImportData]);

  // Memoized selected products count
  const selectedCount = useMemo(() => selectedProducts.size, [selectedProducts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Import</h2>
          <p className="text-gray-600">Fast product import from Alibaba</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshImportData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search & Import
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            History ({importHistory.length})
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          {/* Search Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Alibaba Products
              </CardTitle>
              <CardDescription>
                Find products to import by searching keywords, categories, or brands
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search for products (e.g., wireless earbuds, gaming keyboard)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowImportOptions(!showImportOptions)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

              {/* Import Options */}
              <AnimatePresence>
                {showImportOptions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <h4 className="font-medium">Import Options</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Price Markup</Label>
                        <Select
                          value={importOptions.priceMarkup?.toString() || '1.5'}
                          onValueChange={(value) =>
                            setImportOptions({ ...importOptions, priceMarkup: parseFloat(value) })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1.2">20% markup</SelectItem>
                            <SelectItem value="1.3">30% markup</SelectItem>
                            <SelectItem value="1.4">40% markup</SelectItem>
                            <SelectItem value="1.5">50% markup (recommended)</SelectItem>
                            <SelectItem value="1.75">75% markup</SelectItem>
                            <SelectItem value="2.0">100% markup</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Target Category (optional)</Label>
                        <Select
                          value={importOptions.targetCategory || ''}
                          onValueChange={(value) =>
                            setImportOptions({ ...importOptions, targetCategory: value || undefined })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Use original category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat} value={cat}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search Error */}
              {searchError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{searchError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">
                      {selectedCount} product{selectedCount !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSelectedProducts(new Set())}>
                      Clear Selection
                    </Button>
                    <Button onClick={handleBulkImport} disabled={isImporting}>
                      {isImporting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Import className="h-4 w-4 mr-2" />
                      )}
                      Import Selected
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          {searchResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Search Results ({searchResults.total})
                </h3>
                {searchResults.products.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const allIds = new Set(searchResults.products.map(p => p.id));
                      setSelectedProducts(allIds);
                    }}
                  >
                    Select All
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={selectedProducts.has(product.id)}
                    onToggleSelect={() => toggleProductSelection(product.id)}
                    onPreview={() => setPreviewProduct(product)}
                    onImport={() => handleImportSingle(product)}
                    isImporting={isImporting}
                    isAlreadyImported={!!contentImportManager.isAlreadyImported(product.id)}
                  />
                ))}
              </div>

              {searchResults.products.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600">Try different keywords or check your spelling</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <ImportHistoryView history={importHistory} onRefresh={refreshImportData} />
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <ImportStatsView stats={importStats} />
        </TabsContent>
      </Tabs>

      {/* Product Preview Dialog */}
      <Dialog open={!!previewProduct} onOpenChange={() => setPreviewProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {previewProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{previewProduct.title}</DialogTitle>
                <DialogDescription>Product preview and details</DialogDescription>
              </DialogHeader>
              <ProductPreview product={previewProduct} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Product Card Component
const ProductCard: React.FC<{
  product: AlibabaProductContent;
  isSelected: boolean;
  isAlreadyImported: boolean;
  onToggleSelect: () => void;
  onPreview: () => void;
  onImport: () => void;
  isImporting: boolean;
}> = ({ product, isSelected, isAlreadyImported, onToggleSelect, onPreview, onImport, isImporting }) => {
  return (
    <Card className={`${isSelected ? 'ring-2 ring-blue-500' : ''} relative`}>
      {isAlreadyImported && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Check className="h-3 w-3 mr-1" />
            Imported
          </Badge>
        </div>
      )}
      
      <div className="absolute top-2 left-2 z-10">
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
      </div>

      <CardHeader className="pb-2 pt-8">
        <OptimizedImage
          src={product.images[0]}
          alt={product.title}
          width={250}
          height={200}
          className="w-full h-40 object-cover rounded"
        />
      </CardHeader>

      <CardContent className="space-y-3">
        <h3 className="font-medium line-clamp-2" title={product.title}>
          {product.title}
        </h3>
        
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {product.category}
          </Badge>
          {product.brand && (
            <Badge variant="secondary" className="text-xs">
              {product.brand}
            </Badge>
          )}
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <ImageIcon className="h-3 w-3" />
          {product.images.length} images
          <Tag className="h-3 w-3 ml-2" />
          {product.tags.length} tags
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onPreview} className="flex-1">
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={onImport}
            disabled={isImporting || isAlreadyImported}
            className="flex-1"
          >
            {isImporting ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Import className="h-3 w-3 mr-1" />
            )}
            {isAlreadyImported ? 'Imported' : 'Import'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Product Preview Component  
const ProductPreview: React.FC<{ product: AlibabaProductContent }> = ({ product }) => {
  return (
    <div className="space-y-6">
      {/* Images */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {product.images.map((image, index) => (
          <OptimizedImage
            key={index}
            src={image}
            alt={`${product.title} - Image ${index + 1}`}
            width={200}
            height={150}
            className="w-full h-32 object-cover rounded border"
          />
        ))}
      </div>

      {/* Details */}
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Description</Label>
          <p className="text-sm mt-1">{product.description}</p>
        </div>

        {Object.keys(product.specifications).length > 0 && (
          <div>
            <Label className="text-sm font-medium">Specifications</Label>
            <div className="mt-2 space-y-1">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="font-medium">{key}:</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {product.features && product.features.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Features</Label>
            <ul className="mt-1 list-disc list-inside text-sm space-y-1">
              {product.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
        )}

        {product.tags.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Tags</Label>
            <div className="mt-1 flex flex-wrap gap-1">
              {product.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Import History Component
const ImportHistoryView: React.FC<{
  history: ImportRecord[];
  onRefresh: () => void;
}> = ({ history, onRefresh }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import History</CardTitle>
        <CardDescription>Recent product imports and their status</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No imports yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 50).map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {record.success ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">{record.productName}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(record.importedAt).toLocaleString()}
                  </p>
                  {!record.success && record.errors && (
                    <p className="text-sm text-red-600 mt-1">
                      {record.errors.join(', ')}
                    </p>
                  )}
                </div>
                <Badge variant={record.success ? 'default' : 'destructive'}>
                  {record.success ? 'Success' : 'Failed'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Import Stats Component
const ImportStatsView: React.FC<{ stats: any }> = ({ stats }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Imports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.successRate}%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Imports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.recentImports}</div>
          <p className="text-xs text-gray-500">Last 24 hours</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Last Import</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            {stats.lastImportAt ? (
              <div>
                {new Date(stats.lastImportAt).toLocaleDateString()}
                <br />
                <span className="text-gray-500">
                  {new Date(stats.lastImportAt).toLocaleTimeString()}
                </span>
              </div>
            ) : (
              'Never'
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentImport;