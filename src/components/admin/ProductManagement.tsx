import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Eye, Filter, Loader2, Package, Import } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProductStore } from '@/stores/useProductStore';
import { toast } from 'sonner';
import { ContentImport } from './ContentImport';

const ProductManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'import'>('products');
  
  // Use Zustand store for products
  const { 
    products, 
    loading, 
    error, 
    fetchProducts, 
    deleteProduct,
    setSearchQuery: setStoreSearchQuery,
    clearErrors
  } = useProductStore();

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle search with debouncing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setStoreSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, setStoreSearchQuery]);

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
      return;
    }

    try {
      const result = await deleteProduct(productId);
      if (result.data) {
        toast.success('Product deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete product');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  const handleImportSuccess = (productId: string) => {
    // Refresh products when import is successful
    fetchProducts();
    setActiveTab('products'); // Switch back to products tab
    toast.success('Product imported successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Management</h1>
          <p className="text-gray-600">Manage your product catalog and import from Alibaba</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveTab('import')}>
            <Import className="h-4 w-4 mr-2" />
            Import Products
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products ({products.length})
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Import className="h-4 w-4" />
            Import from Alibaba
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                View and manage all products in your store
              </CardDescription>
            </CardHeader>
            <CardContent>
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription className="flex items-center justify-between">
                {error}
                <Button variant="ghost" size="sm" onClick={clearErrors}>
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
            <Button variant="outline" disabled={loading}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" onClick={fetchProducts} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Refresh
            </Button>
          </div>

          {/* Loading State */}
          {loading && products.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Loading products...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Empty State */}
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Package className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery ? `No products match "${searchQuery}"` : 'Get started by adding your first product'}
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {products.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <img
                              src={product.images?.[0] || `https://via.placeholder.com/64x64?text=${encodeURIComponent(product.name)}`}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://via.placeholder.com/64x64?text=${encodeURIComponent(product.name)}`;
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold">{product.name}</h3>
                                {product.featured && <Badge variant="default">Featured</Badge>}
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{product.description}</p>
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary">{product.category}</Badge>
                                {product.brand && <Badge variant="outline">{product.brand}</Badge>}
                                <Badge variant={product.in_stock ? 'default' : 'destructive'}>
                                  {product.in_stock ? 'In Stock' : 'Out of Stock'}
                                </Badge>
                                {product.stock_quantity !== undefined && (
                                  <Badge variant="outline">Qty: {product.stock_quantity}</Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="text-lg font-bold text-green-600">
                                  ${product.price}
                                </div>
                                {product.compare_at_price && (
                                  <div className="text-sm text-gray-500 line-through">
                                    ${product.compare_at_price}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" title="View Product">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" title="Edit Product">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  title="Delete Product"
                                  onClick={() => handleDeleteProduct(product.id, product.name)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <ContentImport onImportSuccess={handleImportSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductManagement;