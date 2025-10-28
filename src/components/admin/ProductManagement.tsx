import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Package,
  Plus,
  BarChart3,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Star,
  StarOff,
  Upload,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Settings,
  Grid,
  List,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  ImagePlus,
  DollarSign,
  Tag,
  Layers,
  Link,
  Globe,
  ListChecks,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { apiClient, TokenManager } from '@/api/client';
import { backendAuthService } from '@/lib/backendAuth';
import { toast } from 'sonner';
import { handleImageError, getFirstValidImage } from '@/lib/imageUtils';
import { GoogleImageSearch } from '@/components/admin/GoogleImageSearch';

// Interfaces
interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  sku?: string;
  barcode?: string;
  brand?: string;
  category: string;
  category_id?: string;
  tags: string[];
  images: string[];
  in_stock: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  featured: boolean;
  is_active: boolean;
  rating?: number;
  review_count?: number;
  weight?: number;
  dimensions?: any;
  specifications?: any;
  features?: string[];
  meta_title?: string;
  meta_description?: string;
  requires_shipping?: boolean;
  alibaba_url?: string;
  created_at: string;
  updated_at: string;
}

interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  in_stock?: boolean;
  featured?: boolean;
  min_price?: number;
  max_price?: number;
  sort_by?: 'name' | 'price' | 'created_at' | 'rating';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  include_inactive?: boolean;
}

interface ProductStats {
  total: number;
  active: number;
  featured: number;
  outOfStock: number;
  lowStock: number;
}

interface ProductFormContentProps {
  formData: any;
  formErrors: Record<string, string>;
  handleFormChange: (field: string, value: any) => void;
  categories: any[];
  removeImage: (index: number) => void;
  setShowGoogleImageSearch: (show: boolean) => void;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

// Extracted Product Form Component to prevent re-creation on every render
const ProductFormContent = React.memo<ProductFormContentProps>(({
  formData,
  formErrors,
  handleFormChange,
  categories,
  removeImage,
  setShowGoogleImageSearch,
  handleImageUpload,
}) => (
  <div className="max-h-[70vh] overflow-y-auto px-1">
    <div className="space-y-4">
      {/* Basic Information */}
      <div>
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleFormChange('name', e.target.value)}
          placeholder="Enter product name"
        />
        {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleFormChange('description', e.target.value)}
          placeholder="Enter product description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => handleFormChange('price', e.target.value)}
            placeholder="0.00"
          />
          {formErrors.price && <p className="text-sm text-red-500 mt-1">{formErrors.price}</p>}
        </div>
        <div>
          <Label htmlFor="compare_at_price">Compare Price</Label>
          <Input
            id="compare_at_price"
            type="number"
            step="0.01"
            value={formData.compare_at_price}
            onChange={(e) => handleFormChange('compare_at_price', e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="cost_price">Cost Price</Label>
          <Input
            id="cost_price"
            type="number"
            step="0.01"
            value={formData.cost_price}
            onChange={(e) => handleFormChange('cost_price', e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="category_id">Category *</Label>
        <Select value={formData.category_id} onValueChange={(value) => handleFormChange('category_id', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((category: any) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formErrors.category_id && <p className="text-sm text-red-500 mt-1">{formErrors.category_id}</p>}
      </div>

      {/* Product Images */}
      <div>
        <Label>Product Images</Label>
        <div className="space-y-3 mt-2">
          {formData.images.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {formData.images.map((image: string, index: number) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Product ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('image-upload')?.click()}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Images
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
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => handleFormChange('tags', e.target.value)}
          placeholder="electronics, arduino, sensors"
        />
      </div>

      {/* SEO Section */}
      <div className="space-y-3 pt-3 border-t">
        <h3 className="text-sm font-semibold text-gray-700">SEO Settings</h3>
        <div>
          <Label htmlFor="meta_title">Meta Title</Label>
          <Input
            id="meta_title"
            value={formData.meta_title}
            onChange={(e) => handleFormChange('meta_title', e.target.value)}
            placeholder="SEO title for search engines (60 chars max)"
            maxLength={60}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.meta_title.length}/60 characters
          </p>
          {formErrors.meta_title && <p className="text-sm text-red-500 mt-1">{formErrors.meta_title}</p>}
        </div>
        <div>
          <Label htmlFor="meta_description">Meta Description</Label>
          <Textarea
            id="meta_description"
            value={formData.meta_description}
            onChange={(e) => handleFormChange('meta_description', e.target.value)}
            placeholder="SEO description for search engines (160 chars max)"
            rows={3}
            maxLength={160}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.meta_description.length}/160 characters
          </p>
          {formErrors.meta_description && <p className="text-sm text-red-500 mt-1">{formErrors.meta_description}</p>}
        </div>
      </div>

      {/* Inventory */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="stock_quantity">Stock Quantity</Label>
          <Input
            id="stock_quantity"
            type="number"
            value={formData.stock_quantity}
            onChange={(e) => handleFormChange('stock_quantity', e.target.value)}
            placeholder="0"
            disabled={formData.unlimited_stock}
          />
        </div>
        <div className="flex items-center space-x-2 mt-8">
          <Switch
            id="track_inventory"
            checked={formData.track_inventory}
            onCheckedChange={(checked) => handleFormChange('track_inventory', checked)}
          />
          <Label htmlFor="track_inventory">Track Inventory</Label>
        </div>
      </div>

      {/* Status Switches */}
      <div className="space-y-3 pt-3 border-t">
        <div className="flex items-center justify-between">
          <Label htmlFor="featured">Featured Product</Label>
          <Switch
            id="featured"
            checked={formData.featured}
            onCheckedChange={(checked) => handleFormChange('featured', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="is_active">Active</Label>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => handleFormChange('is_active', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="in_stock">In Stock</Label>
          <Switch
            id="in_stock"
            checked={formData.in_stock}
            onCheckedChange={(checked) => handleFormChange('in_stock', checked)}
          />
        </div>
      </div>
    </div>
  </div>
));

ProductFormContent.displayName = 'ProductFormContent';

export const ProductManagement: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // State management
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400); // Debounce search by 400ms

  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    page: 1,
    limit: 10,
    include_inactive: false,
  });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showGoogleImageSearch, setShowGoogleImageSearch] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);

  // Update filters when debounced search changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: debouncedSearch,
      page: 1, // Reset to page 1 when search changes
    }));
  }, [debouncedSearch]);

  // Check URL path for /new route
  useEffect(() => {
    if (location.pathname.includes('/products/new')) {
      setShowCreateDialog(true);
      // Update URL to remove /new when dialog closes
      navigate('/admin/products', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Product creation form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compare_at_price: '',
    cost_price: '',
    sku: '',
    barcode: '',
    brand: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
      unit: 'cm'
    },
    category_id: '',
    tags: '',
    images: [] as string[],
    specifications: [{ key: '', value: '' }] as Array<{ key: string; value: string }>,
    features: [''] as string[],
    in_stock: true,
    stock_quantity: '',
    low_stock_threshold: '',
    track_inventory: true,
    unlimited_stock: false,
    featured: false,
    is_active: true,
    meta_title: '',
    meta_description: '',
    requires_shipping: true,
    alibaba_url: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  // Fetch product statistics
  const {
    data: productStats,
    isLoading: statsLoading,
  } = useQuery<ProductStats>({
    queryKey: ['product-stats'],
    queryFn: () => apiClient.getProductStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch products with filtering
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['admin-products', filters],
    queryFn: () => apiClient.getAdminProducts({
      ...filters,
      offset: (filters.page! - 1) * filters.limit!,
    }),
    keepPreviousData: true,
  });

  // Fetch categories for the form
  const {
    data: categories,
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => apiClient.getAdminCategories(true),
  });

  // Mutations
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteAdminProduct(id),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries(['admin-products']);
      queryClient.invalidateQueries(['product-stats']);
      setSelectedProducts([]);
    },
    onError: () => toast.error('Failed to delete product'),
  });

  const bulkOperationMutation = useMutation({
    mutationFn: ({ action, ids, data }: { action: string; ids: string[]; data?: any }) =>
      apiClient.bulkProductOperations(action, ids, data),
    onSuccess: (_, variables) => {
      toast.success(`Bulk ${variables.action} completed successfully`);
      queryClient.invalidateQueries(['admin-products']);
      queryClient.invalidateQueries(['product-stats']);
      setSelectedProducts([]);
    },
    onError: () => toast.error('Bulk operation failed'),
  });

  const createProductMutation = useMutation({
    mutationFn: (productData: any) => apiClient.createAdminProduct(productData),
    onSuccess: () => {
      toast.success('Product created successfully');
      queryClient.invalidateQueries(['admin-products']);
      queryClient.invalidateQueries(['product-stats']);
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Failed to create product');
      if (error.errors) {
        setFormErrors(error.errors);
      }
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateAdminProduct(id, data),
    onSuccess: () => {
      toast.success('Product updated successfully');
      queryClient.invalidateQueries(['admin-products']);
      queryClient.invalidateQueries(['product-stats']);
      setShowEditDialog(false);
      setEditingProduct(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Failed to update product');
      if (error.errors) {
        setFormErrors(error.errors);
      }
    },
  });

  // CSV Handlers
  const handleExportCSV = async () => {
    try {
      toast.info('Preparing CSV export...');
      const token = TokenManager.getAccessToken();
      
      // Build query params from current filters
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.brand) queryParams.append('brand', filters.brand);
      
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/products/admin/csv/export?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `lab404-products-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Products exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export products');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = TokenManager.getAccessToken();
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/products/admin/csv/template`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Template download failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'lab404-products-template.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template');
    }
  };

  const handleImportCSV = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsImporting(true);
    try {
      const text = await csvFile.text();
      const token = TokenManager.getAccessToken();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/products/admin/csv/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvContent: text }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.data?.errors) {
          setImportResults({ success: false, errors: data.data.errors });
          toast.error(`CSV validation failed: ${data.data.errors.length} errors found`);
        } else {
          throw new Error(data.message || 'Import failed');
        }
        return;
      }
      
      setImportResults(data.data);
      toast.success(`Import completed: ${data.data.successful} products imported successfully`);
      queryClient.invalidateQueries(['admin-products']);
      queryClient.invalidateQueries(['product-stats']);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import CSV');
    } finally {
      setIsImporting(false);
    }
  };

  // Computed values
  const products = productsData?.data || [];
  const totalProducts = productsData?.pagination?.total || 0;
  const currentPage = filters.page || 1;
  const totalPages = Math.ceil(totalProducts / (filters.limit || 10));

  // Handlers
  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value, // Reset to page 1 when filters change
    }));
  };

  const handleSort = (sortBy: string) => {
    const newSortOrder = filters.sort_by === sortBy && filters.sort_order === 'asc' ? 'desc' : 'asc';
    handleFilterChange('sort_by', sortBy);
    handleFilterChange('sort_order', newSortOrder);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p: Product) => p.id));
    }
  };

  const handleBulkOperation = (action: string, data?: any) => {
    if (selectedProducts.length === 0) {
      toast.error('Please select products first');
      return;
    }
    bulkOperationMutation.mutate({ action, ids: selectedProducts, data });
  };

  const handleDeleteProduct = (id: string) => {
    deleteProductMutation.mutate(id);
  };

  const refreshData = () => {
    refetchProducts();
    queryClient.invalidateQueries(['product-stats']);
  };


  // Form handlers
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      compare_at_price: '',
      cost_price: '',
      sku: '',
      barcode: '',
      brand: '',
      weight: '',
      dimensions: {
        length: '',
        width: '',
        height: '',
        unit: 'cm'
      },
      category_id: '',
      tags: '',
      images: [],
      specifications: [{ key: '', value: '' }],
      features: [''],
      in_stock: true,
      stock_quantity: '',
      low_stock_threshold: '',
      track_inventory: true,
      unlimited_stock: false,
      featured: false,
      is_active: true,
      meta_title: '',
      meta_description: '',
      requires_shipping: true,
      alibaba_url: '',
    });
    setFormErrors({});
  };

  // Reset form when create dialog opens to ensure clean state
  useEffect(() => {
    if (showCreateDialog) {
      resetForm();
    }
  }, [showCreateDialog]);

  const handleFormChange = (field: string, value: any) => {
    // When category_id changes, also update the category name
    if (field === 'category_id' && categories) {
      const selectedCategory = categories.find((cat: any) => cat.id === value);
      setFormData(prev => ({
        ...prev,
        [field]: value,
        category: selectedCategory?.name || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Check authentication before upload
    if (!backendAuthService.isAuthenticated()) {
      console.error('Upload failed: User not authenticated');
      toast.error('Authentication required. Please log in again.');

      // Clear the file input
      event.target.value = '';

      // Optional: Redirect to login or trigger auth refresh
      try {
        await backendAuthService.refreshAuth();
        toast.info('Session refreshed. Please try uploading again.');
      } catch (refreshError) {
        console.error('Auth refresh failed:', refreshError);
      }
      return;
    }

    try {
      // Show loading toast
      const uploadingToast = toast.loading(`Uploading ${files.length} image${files.length > 1 ? 's' : ''}...`);

      // Upload each file to ImageKit
      const uploadPromises = Array.from(files).map(async (file) => {
        const formDataUpload = new FormData();
        formDataUpload.append('image', file);

        // Add product ID if editing existing product
        if (editingProduct?.id) {
          formDataUpload.append('productId', editingProduct.id);
        }

        const response = await apiClient.uploadImage(formDataUpload);
        return response.url; // Return the ImageKit URL
      });

      const uploadedImageUrls = await Promise.all(uploadPromises);

      // Update form data with ImageKit URLs
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImageUrls]
      }));

      // Dismiss loading toast and show success
      toast.dismiss(uploadingToast);
      toast.success(`Successfully uploaded ${files.length} image${files.length > 1 ? 's' : ''}!`);
    } catch (error: any) {
      console.error('Error uploading images:', error);

      // Handle authentication errors specifically
      if (error?.statusCode === 401 || error?.statusCode === 403) {
        toast.error('Authentication expired. Please log in again.');
        try {
          await backendAuthService.refreshAuth();
          toast.info('Session refreshed. Please try uploading again.');
        } catch (refreshError) {
          console.error('Auth refresh failed:', refreshError);
        }
      } else {
        toast.error('Failed to upload images. Please try again.');
      }

      // Clear the file input on error
      event.target.value = '';
    }
  };

  const handleGoogleImagesSelected = async (imageUrls: string[]) => {
    try {
      // Show loading toast
      const uploadingToast = toast.loading(`Downloading and uploading ${imageUrls.length} image${imageUrls.length > 1 ? 's' : ''}...`);

      // Download images from Google and upload to ImageKit via backend
      const folder = editingProduct?.id ? `products/${editingProduct.id}` : 'products';
      const response = await apiClient.downloadGoogleImagesBatch(imageUrls, folder);

      // Filter successful uploads
      const successfulUploads = response.results
        .filter(r => r.success && r.imagekitUrl)
        .map(r => r.imagekitUrl!);

      if (successfulUploads.length > 0) {
        // Update form data with ImageKit URLs
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...successfulUploads]
        }));

        // Dismiss loading toast and show success
        toast.dismiss(uploadingToast);
        toast.success(`Successfully added ${successfulUploads.length} image${successfulUploads.length > 1 ? 's' : ''}!`);
      }

      // Show warnings for failed uploads
      const failures = response.results.filter(r => !r.success);
      if (failures.length > 0) {
        toast.dismiss(uploadingToast);
        toast.warning(`${failures.length} image${failures.length > 1 ? 's' : ''} failed to upload`);
      }
    } catch (error: any) {
      console.error('Error downloading Google images:', error);
      toast.error('Failed to download images from Google. Please try again.');
    }

    // Close the dialog
    setShowGoogleImageSearch(false);
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Specifications handlers
  const addSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }]
    }));
  };

  const removeSpecification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };

  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.map((spec, i) =>
        i === index ? { ...spec, [field]: value } : spec
      )
    }));
  };

  // Features handlers
  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) =>
        i === index ? value : feature
      )
    }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Required fields validation
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.price.trim()) errors.price = 'Price is required';
    if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      errors.price = 'Price must be a positive number';
    }
    if (!formData.category_id) errors.category_id = 'Category is required';

    // Optional price fields validation
    if (formData.compare_at_price && (isNaN(Number(formData.compare_at_price)) || Number(formData.compare_at_price) <= 0)) {
      errors.compare_at_price = 'Compare at price must be a positive number';
    }
    if (formData.cost_price && (isNaN(Number(formData.cost_price)) || Number(formData.cost_price) < 0)) {
      errors.cost_price = 'Cost price must be a non-negative number';
    }

    // Weight validation
    if (formData.weight && (isNaN(Number(formData.weight)) || Number(formData.weight) < 0)) {
      errors.weight = 'Weight must be a non-negative number';
    }

    // Inventory validation
    if (formData.track_inventory && !formData.unlimited_stock) {
      if (!formData.stock_quantity.trim()) errors.stock_quantity = 'Stock quantity is required when tracking inventory';
      if (isNaN(Number(formData.stock_quantity)) || Number(formData.stock_quantity) < 0) {
        errors.stock_quantity = 'Stock quantity must be a non-negative number';
      }
    }

    // SEO validation
    if (formData.meta_title && formData.meta_title.length > 60) {
      errors.meta_title = 'Meta title must be 60 characters or less';
    }
    if (formData.meta_description && formData.meta_description.length > 160) {
      errors.meta_description = 'Meta description must be 160 characters or less';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const productData = {
        ...formData,
        price: Number(formData.price),
        compare_at_price: formData.compare_at_price ? Number(formData.compare_at_price) : undefined,
        cost_price: formData.cost_price ? Number(formData.cost_price) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
        dimensions: (formData.dimensions.length || formData.dimensions.width || formData.dimensions.height)
          ? formData.dimensions
          : undefined,
        stock_quantity: formData.unlimited_stock
          ? 999999
          : formData.track_inventory
            ? Number(formData.stock_quantity)
            : 0,
        low_stock_threshold: formData.unlimited_stock
          ? 0
          : formData.low_stock_threshold
            ? Number(formData.low_stock_threshold)
            : 5,
        track_inventory: formData.unlimited_stock ? false : formData.track_inventory,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        features: formData.features.filter(f => f.trim()),
        specifications: Object.fromEntries(
          formData.specifications
            .filter(s => s.key.trim() && s.value.trim())
            .map(s => [s.key, s.value])
        ),
        // Ensure images is always an array
        images: Array.isArray(formData.images) ? formData.images : [],
      };

      if (editingProduct) {
        await updateProductMutation.mutateAsync({ id: editingProduct.id, data: productData });
      } else {
        await createProductMutation.mutateAsync(productData);
      }
    } catch (error: any) {
      // Handle validation errors
      if (error.statusCode === 422 && error.errors) {
        setFormErrors(error.errors);
        toast.error('Please fix the validation errors');
      } else {
        // Handle other errors
        toast.error(error.message || 'Failed to save product');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price.toString(),
      compare_at_price: product.compare_at_price?.toString() || '',
      cost_price: product.cost_price?.toString() || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      brand: product.brand || '',
      weight: product.weight?.toString() || '',
      dimensions: product.dimensions || {
        length: '',
        width: '',
        height: '',
        unit: 'cm'
      },
      category_id: product.category_id || '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
      specifications: product.specifications && typeof product.specifications === 'object'
        ? Object.entries(product.specifications).map(([key, value]) => ({ key, value: String(value) }))
        : [{ key: '', value: '' }],
      features: Array.isArray(product.features) && product.features.length > 0
        ? product.features
        : [''],
      in_stock: product.in_stock,
      stock_quantity: product.stock_quantity.toString(),
      low_stock_threshold: product.low_stock_threshold.toString(),
      track_inventory: product.track_inventory,
      unlimited_stock: !product.track_inventory && product.stock_quantity >= 999999,
      featured: product.featured,
      is_active: product.is_active,
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
      requires_shipping: product.requires_shipping ?? true,
      alibaba_url: product.alibaba_url || '',
    });
    setShowEditDialog(true);
  };

  // Get status badge color and text
  const getStatusBadge = (product: Product) => {
    if (!product.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (!product.in_stock) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (product.stock_quantity <= product.low_stock_threshold) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Low Stock</Badge>;
    }
    return <Badge variant="outline" className="border-green-500 text-green-600">In Stock</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Product Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your product catalog, inventory, and pricing
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={refreshData}
            variant="outline"
            disabled={productsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${productsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/alibaba-import')}
          >
            <Globe className="h-4 w-4 mr-2" />
            Import from Alibaba
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                productStats?.total.toLocaleString() || '0'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {productStats?.active || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                productStats?.lowStock || '0'
              )}
            </div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                productStats?.outOfStock || '0'
              )}
            </div>
            <p className="text-xs text-muted-foreground">Unavailable</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                productStats?.featured || '0'
              )}
            </div>
            <p className="text-xs text-muted-foreground">Promoted products</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                {totalProducts} total products
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
              {searchInput && searchInput !== debouncedSearch && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <Select
              value={filters.sort_by || 'created_at'}
              onValueChange={(value) => handleFilterChange('sort_by', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort(filters.sort_by || 'created_at')}
            >
              {filters.sort_order === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4 space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={filters.category || ''}
                    onValueChange={(value) => handleFilterChange('category', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Components">Components</SelectItem>
                      <SelectItem value="Tools">Tools</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Stock Status</label>
                  <Select
                    value={filters.in_stock?.toString() || ''}
                    onValueChange={(value) => handleFilterChange('in_stock', value ? value === 'true' : undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All products</SelectItem>
                      <SelectItem value="true">In Stock</SelectItem>
                      <SelectItem value="false">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Featured</label>
                  <Select
                    value={filters.featured?.toString() || ''}
                    onValueChange={(value) => handleFilterChange('featured', value ? value === 'true' : undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All products</SelectItem>
                      <SelectItem value="true">Featured</SelectItem>
                      <SelectItem value="false">Not Featured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_inactive"
                    checked={filters.include_inactive || false}
                    onCheckedChange={(checked) => handleFilterChange('include_inactive', checked)}
                  />
                  <label htmlFor="include_inactive" className="text-sm font-medium">
                    Include inactive
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4 flex items-center justify-between"
            >
              <span className="text-sm font-medium">
                {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkOperation('feature')}
                >
                  <Star className="h-4 w-4 mr-1" />
                  Feature
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkOperation('unfeature')}
                >
                  <StarOff className="h-4 w-4 mr-1" />
                  Unfeature
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Selected Products</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''}?
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleBulkOperation('delete')}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          )}

          {/* Products Table */}
          {viewMode === 'table' && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Product
                        {filters.sort_by === 'name' && (
                          filters.sort_order === 'desc' ? <SortDesc className="ml-1 h-4 w-4" /> : <SortAsc className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleSort('price')}
                    >
                      <div className="flex items-center">
                        Price
                        {filters.sort_by === 'price' && (
                          filters.sort_order === 'desc' ? <SortDesc className="ml-1 h-4 w-4" /> : <SortAsc className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center">
                        Created
                        {filters.sort_by === 'created_at' && (
                          filters.sort_order === 'desc' ? <SortDesc className="ml-1 h-4 w-4" /> : <SortAsc className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsLoading ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
                            <div>
                              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      </TableRow>
                    ))
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">No products found</p>
                        {searchInput && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => setSearchInput('')}
                          >
                            Clear search
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product: Product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => handleSelectProduct(product.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                              {product.images?.length > 0 ? (
                                <img
                                  src={getFirstValidImage(product.images)}
                                  alt={product.name}
                                  className="h-10 w-10 object-cover rounded"
                                  onError={handleImageError}
                                />
                              ) : (
                                <Package className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium">{product.name}</p>
                                {product.featured && <Star className="h-4 w-4 text-yellow-500" />}
                              </div>
                              <p className="text-sm text-gray-500">{product.sku}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">${Number(product.price || 0).toFixed(2)}</p>
                            {product.compare_at_price && (
                              <p className="text-sm text-gray-500 line-through">
                                ${Number(product.compare_at_price || 0).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{product.stock_quantity}</p>
                            {product.track_inventory && product.stock_quantity <= product.low_stock_threshold && (
                              <p className="text-yellow-600">Low</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(product)}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-500">
                            {new Date(product.created_at).toLocaleDateString()}
                          </p>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleBulkOperation(product.featured ? 'unfeature' : 'feature', undefined)}
                              >
                                {product.featured ? (
                                  <>
                                    <StarOff className="h-4 w-4 mr-2" />
                                    Unfeature
                                  </>
                                ) : (
                                  <>
                                    <Star className="h-4 w-4 mr-2" />
                                    Feature
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Showing {totalProducts === 0 ? 0 : (currentPage - 1) * (filters.limit || 10) + 1} to {Math.min(currentPage * (filters.limit || 10), totalProducts)} of {totalProducts} products
              </div>
              <div className="flex items-center space-x-2">
                <Label className="text-sm text-gray-600">Per page:</Label>
                <Select
                  value={filters.limit?.toString() || '10'}
                  onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('page', 1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('page', currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">
                Page {currentPage} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('page', currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('page', totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Product Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
            <DialogDescription>
              Add a new product to your catalog
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitProduct}>
            <ProductFormContent
              formData={formData}
              formErrors={formErrors}
              handleFormChange={handleFormChange}
              categories={categories || []}
              removeImage={removeImage}
              setShowGoogleImageSearch={setShowGoogleImageSearch}
              handleImageUpload={handleImageUpload}
            />
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitProduct}>
            <ProductFormContent
              formData={formData}
              formErrors={formErrors}
              handleFormChange={handleFormChange}
              categories={categories || []}
              removeImage={removeImage}
              setShowGoogleImageSearch={setShowGoogleImageSearch}
              handleImageUpload={handleImageUpload}
            />
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Google Image Search Dialog */}
      <GoogleImageSearch
        open={showGoogleImageSearch}
        onOpenChange={setShowGoogleImageSearch}
        onSelectImages={handleGoogleImagesSelected}
        multiSelect={true}
        maxSelections={10}
        initialQuery={formData.name}
      />

      {/* CSV Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => {
        setShowImportDialog(open);
        if (!open) {
          setCsvFile(null);
          setImportResults(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Products from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk import or update products
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="csv-file" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      {csvFile ? csvFile.name : 'Choose a CSV file'}
                    </span>
                    <input
                      id="csv-file"
                      name="csv-file"
                      type="file"
                      accept=".csv"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCsvFile(file);
                          setImportResults(null);
                        }
                      }}
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    CSV file up to 10MB
                  </p>
                </div>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('csv-file')?.click()}
                  >
                    Select File
                  </Button>
                </div>
              </div>
            </div>

            {/* Import Results */}
            {importResults && (
              <div className={`p-4 rounded-lg ${importResults.success === false ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <h4 className="font-semibold mb-2">
                  {importResults.success === false ? 'Validation Errors' : 'Import Results'}
                </h4>
                {importResults.success === false ? (
                  <ul className="text-sm text-red-700 space-y-1">
                    {importResults.errors?.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm space-y-2">
                    <p className="text-green-700">
                      <strong>Total:</strong> {importResults.total} products
                    </p>
                    <p className="text-green-700">
                      <strong>Successful:</strong> {importResults.successful} imported
                    </p>
                    {importResults.failed > 0 && (
                      <div>
                        <p className="text-red-700">
                          <strong>Failed:</strong> {importResults.failed} products
                        </p>
                        <ul className="text-red-600 mt-1 space-y-1">
                          {importResults.results?.failed?.map((item: any, index: number) => (
                            <li key={index}>• {item.name}: {item.error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Download the CSV template to see the required format</li>
                <li>• Required fields: name, price, category</li>
                <li>• Use pipe (|) to separate multiple values (tags, images, features)</li>
                <li>• Products with existing SKU will be updated</li>
                <li>• New products will be created automatically</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowImportDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleImportCSV}
              disabled={!csvFile || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Products
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
