import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ShoppingCart, Menu, Home, Package, Info, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
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
import { useDebouncedCallback } from '@/hooks/usePerformance';
import { db } from '@/lib/services/database';
import CartIcon from '@/components/CartIcon';
import ProductCard from '@/components/ProductCard';
import CartDrawer from '@/components/CartDrawer';

// MenuBar props interface
interface MenuBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  handleCategoryChange: (category: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  categories: string[];
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  setCartOpen: (open: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  priceRange: [number, number];
  handlePriceRangeChange: (range: [number, number]) => void;
}

// Memoized MenuBar component to prevent unnecessary re-renders
const MenuBar = React.memo<MenuBarProps>(({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  handleCategoryChange,
  sortBy,
  setSortBy,
  categories,
  showFilters,
  setShowFilters,
  setCartOpen,
  mobileMenuOpen,
  setMobileMenuOpen,
  priceRange,
  handlePriceRangeChange
}) => (
  <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        {/* Left side - Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
            <Home className="h-4 w-4" />
            <span className="font-medium">Home</span>
          </Link>
          <Link to="/store" className="flex items-center space-x-2 text-blue-600 font-medium">
            <Package className="h-4 w-4" />
            <span>Products</span>
          </Link>
        </div>

        {/* Center - Search integrated with Header SearchBar */}
        <div className="flex-1 max-w-lg mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center space-x-4">
          {/* Category Filter - Desktop */}
          <div className="hidden lg:block">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
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

          {/* Cart Button */}
          <CartIcon
            onClick={() => setCartOpen(true)}
          />

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
                      className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
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
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <ShoppingCart className="h-4 w-4" />
                        <span>Cart</span>
                      </div>
                      <CartIcon onClick={() => setCartOpen(true)} />
                    </div>
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
                    <Select value={selectedCategory} onValueChange={handleCategoryChange}>
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
                      onValueChange={handlePriceRangeChange}
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
));

MenuBar.displayName = 'MenuBar';

const Store = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Use ProductStore for filtering and data
  const {
    products,
    loading,
    error,
    fetchProducts,
    setFilters,
    setSearchQuery: setStoreSearchQuery,
    clearErrors,
    clearFilters,
    pagination,
    setPageSize
  } = useProductStore();

  const { addItem, loading: cartLoading } = useCartStore();

  // Fetch products on mount and handle URL search params
  useEffect(() => {
    fetchProducts();
    
    // Check for search query in URL parameters
    const urlSearchQuery = searchParams.get('search');
    if (urlSearchQuery) {
      setSearchQuery(urlSearchQuery);
      setStoreSearchQuery(urlSearchQuery);
    }
  }, [fetchProducts, searchParams, setStoreSearchQuery]);

  // Optimized debounced search
  const debouncedSearch = useDebouncedCallback((query: string) => {
    setStoreSearchQuery(query);
  }, 500);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === 'all') {
      // Clear the category filter when "all" is selected
      setFilters({ category: undefined });
    } else {
      setFilters({ category });
    }
  };

  // Handle price range change
  const handlePriceRangeChange = (newPriceRange: [number, number]) => {
    setPriceRange(newPriceRange);
    const filters: any = {};
    
    if (newPriceRange[0] > 0 || newPriceRange[1] < 3000) {
      filters.minPrice = newPriceRange[0];
      filters.maxPrice = newPriceRange[1];
    }
    
    setFilters(filters);
  };

  // Simple categories calculation - ProductStore handles filtering
  const categories = [...new Set(products.map(product => product.category))];

  // Handle adding to cart
  const handleAddToCart = async (product: any) => {
    try {
      await addItem(product, 1);
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error('Failed to add item to cart');
    }
  };

  // Handle Load More
  const handleLoadMore = () => {
    const newLimit = pagination.limit + 20;
    setPageSize(newLimit);
  };

  // Check if there are more products to load
  const hasMoreProducts = sortedProducts.length < pagination.total;


  // Transform product data to match ProductCard component expectations
  const transformProductData = (product: any) => ({
    ...product,
    inStock: product.in_stock,
    compareAtPrice: product.compare_at_price,
    images: product.images || [product.image_url],
  });

  // Sort products based on sortBy state
  const sortedProducts = useMemo(() => {
    const productsCopy = [...products];

    switch (sortBy) {
      case 'name':
        return productsCopy.sort((a, b) => a.name.localeCompare(b.name));
      case 'price-low':
        return productsCopy.sort((a, b) => a.price - b.price);
      case 'price-high':
        return productsCopy.sort((a, b) => b.price - a.price);
      default:
        return productsCopy;
    }
  }, [products, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              LAB404 Featured Products
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our hand-picked featured electronics and components
            </p>
          </div>
        </div>
      </div>

      {/* Menu Bar */}
      <MenuBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        handleCategoryChange={handleCategoryChange}
        sortBy={sortBy}
        setSortBy={setSortBy}
        categories={categories}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        setCartOpen={setCartOpen}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        priceRange={priceRange}
        handlePriceRangeChange={handlePriceRangeChange}
      />

      {/* Limited Inventory Notice */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Alert className="border-blue-300 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <span className="font-medium">Limited product catalog:</span> Due to time constraints, we couldn't add our full inventory to the website yet.
              However, we can source <strong>any electronic part you need</strong>! Please{' '}
              <Link to="/#contact" className="underline font-semibold hover:text-blue-700 transition-colors">
                submit the contact form
              </Link>
              {' '}and we'll get in touch with you as soon as possible.
            </AlertDescription>
          </Alert>
        </div>
      </div>

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
                      <Select value={selectedCategory} onValueChange={handleCategoryChange}>
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
                        onValueChange={handlePriceRangeChange}
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
            Showing {sortedProducts.length} products
            {selectedCategory !== 'all' && (
              <span className="ml-2">
                in <Badge variant="outline" className="border-blue-200 text-blue-600">{selectedCategory}</Badge>
              </span>
            )}
            {searchQuery && (
              <span className="ml-2">
                for "<Badge variant="outline" className="border-blue-200 text-blue-600">{searchQuery}</Badge>"
              </span>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <ProductGridSkeleton count={8} />
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
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={transformProductData(product)} />
                ))}
              </motion.div>

              {/* Load More Button */}
              {hasMoreProducts && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center mt-12 mb-8"
                >
                  <p className="text-sm text-gray-600 mb-4">
                    Showing {sortedProducts.length} of {pagination.total} products
                  </p>
                  <Button
                    onClick={handleLoadMore}
                    disabled={loading}
                    size="lg"
                    className="min-w-[200px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More Products
                        <Package className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </>
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
                    clearFilters();
                  }}
                >
                  Clear Filters
                </Button>
              }
            />
          )}
        </AnimatePresence>
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

    </div>
  );
};

export default Store;