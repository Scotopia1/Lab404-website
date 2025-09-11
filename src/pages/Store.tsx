import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Grid, List, Star, ShoppingCart, Heart, Eye, Menu, X, Home, Package, Settings, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProductStore } from '@/stores/useProductStore';
import { useCartStore } from '@/stores/useCartStore';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ProductGridSkeleton, EmptyState } from '@/components/ui/LoadingStates';
import { useDebouncedCallback, useMemoizedComputation, usePerformanceMonitor } from '@/hooks/usePerformance';
import { VirtualizedProductGrid } from '@/components/VirtualizedProductGrid';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

const Store = () => {
  const { renderCount } = usePerformanceMonitor('Store');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Use Supabase stores
  const { 
    products, 
    loading, 
    error, 
    fetchProducts,
    setFilters,
    setSearchQuery: setStoreSearchQuery,
    clearErrors
  } = useProductStore();

  const { addItem, loading: cartLoading } = useCartStore();

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Optimized debounced search
  const debouncedSearch = useDebouncedCallback((query: string) => {
    setStoreSearchQuery(query);
  }, 500);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Update filters when they change
  useEffect(() => {
    const filters: any = {};
    
    if (selectedCategory !== 'all') {
      filters.category = selectedCategory;
    }
    
    if (priceRange[0] > 0 || priceRange[1] < 3000) {
      filters.minPrice = priceRange[0];
      filters.maxPrice = priceRange[1];
    }

    setFilters(filters);
  }, [selectedCategory, priceRange, setFilters]);

  // Memoized categories computation
  const categories = useMemoizedComputation(
    () => [...new Set(products.map(product => product.category))],
    [products],
    products.length > 0
  ) || [];

  // Handle adding to cart
  const handleAddToCart = async (product: any) => {
    try {
      await addItem(product, 1);
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error('Failed to add item to cart');
    }
  };

  // Optimized product sorting with memoization
  const sortedProducts = useMemoizedComputation(
    () => {
      if (products.length === 0) return [];
      
      const sorted = [...products];

      switch (sortBy) {
        case 'price-low':
          return sorted.sort((a, b) => a.price - b.price);
        case 'price-high':
          return sorted.sort((a, b) => b.price - a.price);
        case 'rating':
          return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        case 'newest':
          return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        case 'name':
        default:
          return sorted.sort((a, b) => a.name.localeCompare(b.name));
      }
    },
    [products, sortBy],
    products.length > 0
  ) || [];

  const toggleFavorite = (productId: string) => {
    setFavorites(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const MenuBar = () => (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
              <Home className="h-4 w-4" />
              <span className="font-medium">Home</span>
            </Link>
            <Link to="/store" className="flex items-center space-x-2 text-blue-600 font-medium">
              <Package className="h-4 w-4" />
              <span>Products</span>
            </Link>
            <Link to="/admin" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
              <Settings className="h-4 w-4" />
              <span className="font-medium">Admin</span>
            </Link>
          </div>

          {/* Center - Search Bar */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" aria-hidden="true" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
                aria-label="Search products"
                role="searchbox"
              />
            </div>
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center space-x-4">
            {/* Category Filter - Desktop */}
            <div className="hidden lg:block">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Filter - Desktop */}
            <div className="hidden lg:block">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Filters Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Menu & Filters</SheetTitle>
                  <SheetDescription>
                    Navigate and filter products
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
                  {/* Mobile Navigation */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Navigation</h3>
                    <div className="space-y-2">
                      <Link 
                        to="/" 
                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Home className="h-4 w-4" />
                        <span>Home</span>
                      </Link>
                      <Link 
                        to="/store" 
                        className="flex items-center space-x-2 text-blue-600 font-medium p-2 rounded-lg bg-blue-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Package className="h-4 w-4" />
                        <span>Products</span>
                      </Link>
                      <Link 
                        to="/admin" 
                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Admin</span>
                      </Link>
                    </div>
                  </div>

                  <Separator />

                  {/* Mobile Filters */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Filters</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sort By
                      </label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="price-low">Price: Low to High</SelectItem>
                          <SelectItem value="price-high">Price: High to Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price Range: ${priceRange[0]} - ${priceRange[1]}
                      </label>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={3000}
                        min={0}
                        step={50}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );

  const ProductCard = ({ product }: { product: any }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
        <div className="relative overflow-hidden">
          <OptimizedImage
            src={product.images?.[0] || `https://via.placeholder.com/400x300?text=${encodeURIComponent(product.name)}`}
            alt={product.name}
            width={400}
            height={300}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
            fallbackSrc={`https://via.placeholder.com/400x300?text=${encodeURIComponent(product.name)}`}
            priority={false}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
          
          {/* Action buttons overlay */}
          <div className="absolute top-2 right-2 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => toggleFavorite(product.id)}
            >
              <Heart 
                className={`h-4 w-4 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} 
              />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 rounded-full"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>

          {/* Stock status badge */}
          <div className="absolute top-2 left-2">
            <Badge variant={product.in_stock ? 'default' : 'destructive'}>
              {product.in_stock ? 'In Stock' : 'Out of Stock'}
              {product.stock_quantity && (
                <span className="ml-1">({product.stock_quantity})</span>
              )}
            </Badge>
          </div>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="absolute bottom-2 left-2 flex items-center space-x-1 bg-black bg-opacity-70 text-white px-2 py-1 rounded">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs">{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
              {product.name}
            </CardTitle>
          </div>
          
          <div className="flex items-center space-x-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {product.category}
            </Badge>
            {product.brand && (
              <Badge variant="outline" className="text-xs">
                {product.brand}
              </Badge>
            )}
            {product.featured && (
              <Badge variant="default" className="text-xs">
                Featured
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {product.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-2xl font-bold text-green-600">
                ${product.price.toFixed(2)}
              </div>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <div className="text-sm text-gray-500 line-through">
                  ${product.compare_at_price.toFixed(2)}
                </div>
              )}
            </div>
            
            <Button 
              size="sm" 
              disabled={!product.in_stock || cartLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              onClick={() => handleAddToCart(product)}
            >
              {cartLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4 mr-2" />
              )}
              Add to Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const ProductListItem = ({ product }: { product: any }) => (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex">
          <div className="relative w-32 h-32 flex-shrink-0">
            <OptimizedImage
              src={product.images?.[0] || `https://via.placeholder.com/128x128?text=${encodeURIComponent(product.name)}`}
              alt={product.name}
              width={128}
              height={128}
              className="w-full h-full object-cover"
              fallbackSrc={`https://via.placeholder.com/128x128?text=${encodeURIComponent(product.name)}`}
              priority={false}
            />
            <div className="absolute top-2 left-2">
              <Badge variant={product.in_stock ? 'default' : 'destructive'} className="text-xs">
                {product.in_stock ? 'In Stock' : 'Out'}
                {product.stock_quantity && (
                  <span className="ml-1">({product.stock_quantity})</span>
                )}
              </Badge>
            </div>
            {product.rating > 0 && (
              <div className="absolute bottom-2 left-2 flex items-center space-x-1 bg-black bg-opacity-70 text-white px-2 py-1 rounded">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs">{product.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                
                <div className="flex items-center space-x-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {product.category}
                  </Badge>
                  {product.brand && (
                    <Badge variant="outline" className="text-xs">
                      {product.brand}
                    </Badge>
                  )}
                  {product.featured && (
                    <Badge variant="default" className="text-xs">
                      Featured
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {product.description}
                </p>
              </div>
              
              <div className="text-right ml-4">
                <div className="flex flex-col items-end">
                  <div className="text-2xl font-bold text-green-600">
                    ${product.price.toFixed(2)}
                  </div>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <div className="text-sm text-gray-500 line-through">
                      ${product.compare_at_price.toFixed(2)}
                    </div>
                  )}
                </div>
                
                <div className="space-x-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleFavorite(product.id)}
                  >
                    <Heart 
                      className={`h-4 w-4 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} 
                    />
                  </Button>
                  <Button 
                    size="sm" 
                    disabled={!product.in_stock || cartLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    onClick={() => handleAddToCart(product)}
                  >
                    {cartLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              LAB404 Electronics Store
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover the latest in electronics, from smartphones to laptops and everything in between
            </p>
          </div>
        </div>
      </div>

      {/* Menu Bar */}
      <MenuBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sort By
                      </label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="price-low">Price: Low to High</SelectItem>
                          <SelectItem value="price-high">Price: High to Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price Range: ${priceRange[0]} - ${priceRange[1]}
                      </label>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={3000}
                        min={0}
                        step={50}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            Showing {sortedProducts.length} of {products.length} products
            {selectedCategory !== 'all' && (
              <span className="ml-2">
                in <Badge variant="outline">{selectedCategory}</Badge>
              </span>
            )}
          </div>
        </div>

        {/* Products Grid/List */}
        <AnimatePresence mode="wait">
          {loading ? (
            <ProductGridSkeleton count={viewMode === 'grid' ? 8 : 6} />
          ) : error ? (
            <div className="text-center py-12">
              <Alert variant="destructive" className="mb-4 max-w-md mx-auto">
                <AlertDescription className="flex items-center justify-between">
                  {error}
                  <Button variant="ghost" size="sm" onClick={clearErrors}>
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
              <Button onClick={fetchProducts}>Retry</Button>
            </div>
          ) : sortedProducts.length > 0 ? (
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }
            >
              {sortedProducts.map((product) =>
                viewMode === 'grid' ? (
                  <ProductCard key={product.id} product={product} />
                ) : (
                  <ProductListItem key={product.id} product={product} />
                )
              )}
            </motion.div>
          ) : (
            <EmptyState
              title="No products found"
              description="Try adjusting your search terms or filters"
              icon={Search}
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setPriceRange([0, 3000]);
                  }}
                >
                  Clear Filters
                </Button>
              }
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Store;