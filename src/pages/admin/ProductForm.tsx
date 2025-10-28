import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AlibabaImport from '@/components/AlibabaImport';
import { GoogleImageSearch } from '@/components/admin/GoogleImageSearch';
import { mockProducts, categories } from '@/lib/mockData';
import { ImportedProduct } from '@/lib/types';

// Helper to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface ArrayItem {
  id: string;
  value: string;
}

interface SpecificationItem {
  id: string;
  name: string;
  value: string;
}

interface FormData {
  // Basic Information
  name: string;
  description: string;
  price: number;
  compareAtPrice: number;
  costPrice: number;

  // Product Details
  sku: string;
  barcode: string;
  brand: string;
  weight: number;
  dimensions: { width: number; height: number; depth: number };

  // Category and Organization
  categoryId: string;
  category: string;
  tags: ArrayItem[];

  // Media
  images: ArrayItem[];
  videos: ArrayItem[];

  // Inventory
  inStock: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;

  // Product Features
  specifications: SpecificationItem[];
  features: ArrayItem[];

  // SEO and Meta
  slug: string;
  metaTitle: string;
  metaDescription: string;

  // Settings
  featured: boolean;
  isActive: boolean;
  isDigital: boolean;
  requiresShipping: boolean;

  // Supplier Information
  supplierId: string;
  supplierSku: string;
  alibabaUrl: string;

  // Ratings
  rating: number;
  reviewCount: number;
}

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const existingProduct = isEditing ? mockProducts.find(p => p.id === id) : null;
  const [showGoogleImageSearch, setShowGoogleImageSearch] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    // Basic Information
    name: existingProduct?.name || '',
    description: existingProduct?.description || '',
    price: existingProduct?.price || 0,
    compareAtPrice: existingProduct?.compareAtPrice || 0,
    costPrice: existingProduct?.costPrice || 0,

    // Product Details
    sku: existingProduct?.sku || '',
    barcode: existingProduct?.barcode || '',
    brand: existingProduct?.brand || '',
    weight: existingProduct?.weight || 0,
    dimensions: existingProduct?.dimensions || { width: 0, height: 0, depth: 0 },

    // Category and Organization
    categoryId: existingProduct?.categoryId || '',
    category: existingProduct?.category || '',
    tags: existingProduct?.tags ? existingProduct.tags.map(tag => ({ id: generateId(), value: tag })) : [{ id: generateId(), value: '' }],

    // Media
    images: existingProduct?.images ? existingProduct.images.map(img => ({ id: generateId(), value: img })) : [{ id: generateId(), value: '' }],
    videos: existingProduct?.videos ? existingProduct.videos.map(vid => ({ id: generateId(), value: vid })) : [{ id: generateId(), value: '' }],

    // Inventory
    inStock: existingProduct?.inStock ?? true,
    stockQuantity: existingProduct?.stockQuantity || 999999,
    lowStockThreshold: existingProduct?.lowStockThreshold || 10,
    trackInventory: existingProduct?.trackInventory ?? false,

    // Product Features
    specifications: existingProduct?.specifications ? existingProduct.specifications.map(spec => ({ id: generateId(), name: spec.name, value: spec.value })) : [{ id: generateId(), name: '', value: '' }],
    features: existingProduct?.features ? existingProduct.features.map(feat => ({ id: generateId(), value: feat })) : [{ id: generateId(), value: '' }],

    // SEO and Meta
    slug: existingProduct?.slug || '',
    metaTitle: existingProduct?.metaTitle || '',
    metaDescription: existingProduct?.metaDescription || '',

    // Settings
    featured: existingProduct?.featured ?? false,
    isActive: existingProduct?.isActive ?? true,
    isDigital: existingProduct?.isDigital ?? false,
    requiresShipping: existingProduct?.requiresShipping ?? true,

    // Supplier Information
    supplierId: existingProduct?.supplierId || '',
    supplierSku: existingProduct?.supplierSku || '',
    alibabaUrl: existingProduct?.alibabaUrl || '',

    // Ratings
    rating: existingProduct?.rating || 0,
    reviewCount: existingProduct?.reviewCount || 0
  });

  const handleInputChange = useCallback((field: keyof FormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleArrayChange = useCallback((field: 'images' | 'videos' | 'tags' | 'features', id: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item) =>
        item.id === id ? { ...item, value } : item
      )
    }));
  }, []);

  const handleSpecificationChange = useCallback((id: string, field: 'name' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.map((spec) =>
        spec.id === id ? { ...spec, [field]: value } : spec
      )
    }));
  }, []);

  const addArrayItem = useCallback((field: 'images' | 'videos' | 'tags' | 'features' | 'specifications') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], field === 'specifications' ? { id: generateId(), name: '', value: '' } : { id: generateId(), value: '' }]
    }));
  }, []);

  const removeArrayItem = useCallback((field: 'images' | 'videos' | 'tags' | 'features' | 'specifications', id: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((item) => item.id !== id)
    }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty values and extract values from ArrayItems
    const cleanedData = {
      ...formData,
      images: formData.images.map(item => item.value).filter(img => img.trim()),
      videos: formData.videos.map(item => item.value).filter(video => video.trim()),
      tags: formData.tags.map(item => item.value).filter(tag => tag.trim()),
      features: formData.features.map(item => item.value).filter(feature => feature.trim()),
      specifications: formData.specifications.filter(spec => spec.name.trim() && spec.value.trim()).map(({ name, value }) => ({ name, value }))
    };

    console.log('Product data:', cleanedData);
    alert(`Product ${isEditing ? 'updated' : 'created'} successfully!`);
    navigate('/admin');
  };

  const handleGoogleImagesSelected = (imageUrls: string[]) => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images.filter(img => img.value.trim()), ...imageUrls.map(url => ({ id: generateId(), value: url }))]
    }));
    setShowGoogleImageSearch(false);
  };

  const handleAlibabaImport = (importedProduct: ImportedProduct) => {
    setFormData({
      // Basic Information
      name: importedProduct.name,
      description: importedProduct.description || '',
      price: importedProduct.price,
      compareAtPrice: importedProduct.compareAtPrice || 0,
      costPrice: importedProduct.costPrice || 0,

      // Product Details
      sku: importedProduct.sku || '',
      barcode: importedProduct.barcode || '',
      brand: importedProduct.brand || '',
      weight: importedProduct.weight || 0,
      dimensions: importedProduct.dimensions || { width: 0, height: 0, depth: 0 },

      // Category and Organization
      categoryId: importedProduct.categoryId || '',
      category: importedProduct.category,
      tags: (importedProduct.tags || []).map(tag => ({ id: generateId(), value: tag })),

      // Media
      images: importedProduct.images.map(img => ({ id: generateId(), value: img })),
      videos: (importedProduct.videos || []).map(vid => ({ id: generateId(), value: vid })),

      // Inventory
      inStock: importedProduct.inStock,
      stockQuantity: importedProduct.stockQuantity || 999999,
      lowStockThreshold: importedProduct.lowStockThreshold || 10,
      trackInventory: importedProduct.trackInventory ?? false,

      // Product Features
      specifications: Array.isArray(importedProduct.specifications)
        ? importedProduct.specifications.map(spec => ({ id: generateId(), name: spec.name, value: spec.value }))
        : Object.entries(importedProduct.specifications || {}).map(([name, value]) => ({ id: generateId(), name, value: String(value) })),
      features: (importedProduct.features || []).map(feat => ({ id: generateId(), value: feat })),

      // SEO and Meta
      slug: importedProduct.slug || '',
      metaTitle: importedProduct.metaTitle || '',
      metaDescription: importedProduct.metaDescription || '',

      // Settings
      featured: importedProduct.featured,
      isActive: importedProduct.isActive ?? true,
      isDigital: importedProduct.isDigital ?? false,
      requiresShipping: importedProduct.requiresShipping ?? true,

      // Supplier Information
      supplierId: importedProduct.supplierId || '',
      supplierSku: importedProduct.supplierSku || '',
      alibabaUrl: importedProduct.alibabaUrl || '',

      // Ratings
      rating: importedProduct.rating || 0,
      reviewCount: importedProduct.reviewCount || 0
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="manual" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="alibaba">Import from Alibaba</TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter product description"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="price">Selling Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="compareAtPrice">Compare at Price</Label>
                      <Input
                        id="compareAtPrice"
                        type="number"
                        step="0.01"
                        value={formData.compareAtPrice}
                        onChange={(e) => handleInputChange('compareAtPrice', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="costPrice">Cost Price</Label>
                      <Input
                        id="costPrice"
                        type="number"
                        step="0.01"
                        value={formData.costPrice}
                        onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Product Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => handleInputChange('sku', e.target.value)}
                        placeholder="Product SKU"
                      />
                    </div>

                    <div>
                      <Label htmlFor="barcode">Barcode</Label>
                      <Input
                        id="barcode"
                        value={formData.barcode}
                        onChange={(e) => handleInputChange('barcode', e.target.value)}
                        placeholder="Product barcode"
                      />
                    </div>

                    <div>
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                        placeholder="Product brand"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="weight">Weight (g)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.001"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                        placeholder="0.000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dimensionWidth">Width (cm)</Label>
                      <Input
                        id="dimensionWidth"
                        type="number"
                        step="0.1"
                        value={formData.dimensions.width}
                        onChange={(e) => handleInputChange('dimensions', { ...formData.dimensions, width: parseFloat(e.target.value) || 0 })}
                        placeholder="0.0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dimensionHeight">Height (cm)</Label>
                      <Input
                        id="dimensionHeight"
                        type="number"
                        step="0.1"
                        value={formData.dimensions.height}
                        onChange={(e) => handleInputChange('dimensions', { ...formData.dimensions, height: parseFloat(e.target.value) || 0 })}
                        placeholder="0.0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dimensionDepth">Depth (cm)</Label>
                      <Input
                        id="dimensionDepth"
                        type="number"
                        step="0.1"
                        value={formData.dimensions.depth}
                        onChange={(e) => handleInputChange('dimensions', { ...formData.dimensions, depth: parseFloat(e.target.value) || 0 })}
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.images.map((image) => (
                    <div key={image.id} className="flex items-center space-x-2">
                      <Input
                        value={image.value}
                        onChange={(e) => handleArrayChange('images', image.id, e.target.value)}
                        placeholder="Enter image URL"
                        className="flex-1"
                      />
                      {formData.images.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem('images', image.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addArrayItem('images')}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Image URL
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowGoogleImageSearch(true)}
                      className="flex-1"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Search Google Images
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Google Image Search Dialog */}
              <GoogleImageSearch
                open={showGoogleImageSearch}
                onOpenChange={setShowGoogleImageSearch}
                onSelectImages={handleGoogleImagesSelected}
                multiSelect={true}
                maxSelections={10}
                initialQuery={formData.name}
              />

              {/* Videos */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Videos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.videos.map((video) => (
                    <div key={video.id} className="flex items-center space-x-2">
                      <Input
                        value={video.value}
                        onChange={(e) => handleArrayChange('videos', video.id, e.target.value)}
                        placeholder="Enter video URL"
                        className="flex-1"
                      />
                      {formData.videos.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem('videos', video.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('videos')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Video
                  </Button>
                </CardContent>
              </Card>

              {/* Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.specifications.map((spec) => (
                    <div key={spec.id} className="grid grid-cols-2 gap-4">
                      <Input
                        value={spec.name}
                        onChange={(e) => handleSpecificationChange(spec.id, 'name', e.target.value)}
                        placeholder="Specification name"
                      />
                      <div className="flex items-center space-x-2">
                        <Input
                          value={spec.value}
                          onChange={(e) => handleSpecificationChange(spec.id, 'value', e.target.value)}
                          placeholder="Specification value"
                          className="flex-1"
                        />
                        {formData.specifications.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeArrayItem('specifications', spec.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('specifications')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Specification
                  </Button>
                </CardContent>
              </Card>

              {/* Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.features.map((feature) => (
                    <div key={feature.id} className="flex items-center space-x-2">
                      <Input
                        value={feature.value}
                        onChange={(e) => handleArrayChange('features', feature.id, e.target.value)}
                        placeholder="Enter product feature"
                        className="flex-1"
                      />
                      {formData.features.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem('features', feature.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('features')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                  </Button>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.tags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Input
                        value={tag.value}
                        onChange={(e) => handleArrayChange('tags', tag.id, e.target.value)}
                        placeholder="Enter tag"
                        className="flex-1"
                      />
                      {formData.tags.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem('tags', tag.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('tags')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tag
                  </Button>
                </CardContent>
              </Card>

              {/* Inventory */}
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="stockQuantity">Stock Quantity</Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        value={formData.stockQuantity}
                        onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value) || 0)}
                        placeholder="999999"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                      <Input
                        id="lowStockThreshold"
                        type="number"
                        value={formData.lowStockThreshold}
                        onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value) || 0)}
                        placeholder="10"
                      />
                    </div>

                    <div className="flex items-center space-x-2 mt-6">
                      <Switch
                        id="trackInventory"
                        checked={formData.trackInventory}
                        onCheckedChange={(checked) => handleInputChange('trackInventory', checked)}
                      />
                      <Label htmlFor="trackInventory">Track Inventory</Label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="inStock">In Stock</Label>
                      <p className="text-sm text-gray-500">Product is available for purchase</p>
                    </div>
                    <Switch
                      id="inStock"
                      checked={formData.inStock}
                      onCheckedChange={(checked) => handleInputChange('inStock', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* SEO & Meta */}
              <Card>
                <CardHeader>
                  <CardTitle>SEO & Meta Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      placeholder="product-url-slug"
                    />
                  </div>

                  <div>
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      value={formData.metaTitle}
                      onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                      placeholder="SEO title (max 60 characters)"
                      maxLength={60}
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.metaTitle.length}/60 characters</p>
                  </div>

                  <div>
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      value={formData.metaDescription}
                      onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                      placeholder="SEO description (max 160 characters)"
                      maxLength={160}
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.metaDescription.length}/160 characters</p>
                  </div>
                </CardContent>
              </Card>

              {/* Product Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="featured">Featured Product</Label>
                        <p className="text-sm text-gray-500">Show on homepage</p>
                      </div>
                      <Switch
                        id="featured"
                        checked={formData.featured}
                        onCheckedChange={(checked) => handleInputChange('featured', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="isActive">Active Product</Label>
                        <p className="text-sm text-gray-500">Visible to customers</p>
                      </div>
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="isDigital">Digital Product</Label>
                        <p className="text-sm text-gray-500">No physical shipping</p>
                      </div>
                      <Switch
                        id="isDigital"
                        checked={formData.isDigital}
                        onCheckedChange={(checked) => handleInputChange('isDigital', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="requiresShipping">Requires Shipping</Label>
                        <p className="text-sm text-gray-500">Physical delivery needed</p>
                      </div>
                      <Switch
                        id="requiresShipping"
                        checked={formData.requiresShipping}
                        onCheckedChange={(checked) => handleInputChange('requiresShipping', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Supplier Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="supplierId">Supplier ID</Label>
                      <Input
                        id="supplierId"
                        value={formData.supplierId}
                        onChange={(e) => handleInputChange('supplierId', e.target.value)}
                        placeholder="Supplier identifier"
                      />
                    </div>

                    <div>
                      <Label htmlFor="supplierSku">Supplier SKU</Label>
                      <Input
                        id="supplierSku"
                        value={formData.supplierSku}
                        onChange={(e) => handleInputChange('supplierSku', e.target.value)}
                        placeholder="Supplier's product code"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="alibabaUrl">Alibaba URL</Label>
                    <Input
                      id="alibabaUrl"
                      value={formData.alibabaUrl}
                      onChange={(e) => handleInputChange('alibabaUrl', e.target.value)}
                      placeholder="https://..."
                      type="url"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Link to="/admin">
                  <Button variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="alibaba">
            <AlibabaImport onImport={handleAlibabaImport} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductForm;