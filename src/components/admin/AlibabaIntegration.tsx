import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  ShoppingCart,
  Star,
  MapPin,
  Truck,
  AlertCircle,
  CheckCircle,
  Loader2,
  Filter,
  Grid,
  List
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlibabaProduct } from '@/lib/types';

const AlibabaIntegration = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AlibabaProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minOrderQty, setMinOrderQty] = useState<[number]>([1]);
  const [showFilters, setShowFilters] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('disconnected');

  // Mock Alibaba products
  const mockAlibabaProducts: AlibabaProduct[] = [
    {
      id: 'ali_001',
      title: 'Arduino Compatible UNO R3 Development Board',
      price: { min: 2.50, max: 3.20, currency: 'USD' },
      minOrderQuantity: 10,
      supplier: {
        name: 'Shenzhen Electronics Co., Ltd.',
        rating: 4.8,
        location: 'Guangdong, China',
        responseRate: '98%',
        onTimeDelivery: '95%'
      },
      images: ['https://via.placeholder.com/300x300?text=Arduino+UNO'],
      category: 'Development Boards',
      description: 'High quality Arduino compatible development board with USB cable included. Perfect for prototyping and educational projects.',
      specifications: {
        'Microcontroller': 'ATmega328P',
        'Operating Voltage': '5V',
        'Digital I/O Pins': '14',
        'Analog Input Pins': '6'
      },
      shipping: {
        methods: ['Express', 'Standard'],
        time: '7-15 days',
        cost: 'Free for orders over $50'
      },
      certifications: ['CE', 'FCC', 'RoHS']
    },
    {
      id: 'ali_002',
      title: 'Raspberry Pi 4 Model B Compatible Board',
      price: { min: 45.00, max: 55.00, currency: 'USD' },
      minOrderQuantity: 5,
      supplier: {
        name: 'Tech Innovation Ltd.',
        rating: 4.9,
        location: 'Shanghai, China',
        responseRate: '99%',
        onTimeDelivery: '97%'
      },
      images: ['https://via.placeholder.com/300x300?text=Raspberry+Pi+4'],
      category: 'Single Board Computers',
      description: 'Powerful single-board computer compatible with Raspberry Pi 4. Includes 4GB RAM and built-in WiFi.',
      specifications: {
        'CPU': 'Quad-core ARM Cortex-A72',
        'RAM': '4GB LPDDR4',
        'Storage': 'MicroSD',
        'Connectivity': 'WiFi, Bluetooth, Ethernet'
      },
      shipping: {
        methods: ['Express', 'Air Freight'],
        time: '5-12 days',
        cost: '$15-25'
      },
      certifications: ['CE', 'FCC']
    },
    {
      id: 'ali_003',
      title: 'ESP32 WiFi Bluetooth Development Board',
      price: { min: 3.80, max: 4.50, currency: 'USD' },
      minOrderQuantity: 20,
      supplier: {
        name: 'IoT Solutions Inc.',
        rating: 4.7,
        location: 'Shenzhen, China',
        responseRate: '96%',
        onTimeDelivery: '93%'
      },
      images: ['https://via.placeholder.com/300x300?text=ESP32'],
      category: 'WiFi Modules',
      description: 'Dual-core ESP32 development board with built-in WiFi and Bluetooth. Ideal for IoT projects.',
      specifications: {
        'CPU': 'Dual-core Tensilica LX6',
        'WiFi': '802.11 b/g/n',
        'Bluetooth': 'v4.2 BR/EDR and BLE',
        'GPIO': '30 pins'
      },
      shipping: {
        methods: ['Express', 'Standard'],
        time: '8-16 days',
        cost: 'Free for orders over $30'
      },
      certifications: ['CE', 'FCC', 'IC']
    }
  ];

  // Simulate API connection
  const connectToAlibaba = async () => {
    setConnectionStatus('connecting');
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setConnectionStatus('connected');
    setApiConnected(true);
  };

  // Simulate search
  const handleSearch = async () => {
    if (!apiConnected) {
      await connectToAlibaba();
    }
    
    setIsSearching(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Filter mock products based on search query
    const filtered = mockAlibabaProducts.filter(product =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setSearchResults(filtered);
    setIsSearching(false);
  };

  // Handle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Import selected products
  const importSelectedProducts = async () => {
    if (selectedProducts.length === 0) return;
    
    setIsImporting(true);
    setImportProgress(0);
    
    // Simulate import progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setImportProgress(i);
    }
    
    // Reset after import
    setTimeout(() => {
      setIsImporting(false);
      setImportProgress(0);
      setSelectedProducts([]);
    }, 1000);
  };

  const ProductCard = ({ product }: { product: AlibabaProduct }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <Card className={`h-full cursor-pointer transition-all duration-200 ${
        selectedProducts.includes(product.id) 
          ? 'ring-2 ring-blue-500 shadow-lg' 
          : 'hover:shadow-md'
      }`}>
        <CardHeader className="pb-3">
          <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://via.placeholder.com/300x300?text=${encodeURIComponent(product.title)}`;
              }}
            />
          </div>
          
          <CardTitle className="text-lg leading-tight line-clamp-2">
            {product.title}
          </CardTitle>
          
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {product.category}
            </Badge>
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-gray-600">{product.supplier.rating}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Price Range:</span>
              <span className="text-lg font-bold text-green-600">
                ${product.price.min} - ${product.price.max}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Min Order:</span>
              <span className="font-medium">{product.minOrderQuantity} pcs</span>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{product.supplier.location}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Truck className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{product.shipping.time}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('#', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Alibaba
            </Button>
            
            <Button
              size="sm"
              onClick={() => toggleProductSelection(product.id)}
              className={selectedProducts.includes(product.id) ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {selectedProducts.includes(product.id) ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Selected
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Select
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Alibaba API Connection</span>
            {connectionStatus === 'connected' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {connectionStatus === 'connecting' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
            {connectionStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
          </CardTitle>
          <CardDescription>
            Connect to Alibaba API to search and import products
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectionStatus === 'disconnected' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Not connected to Alibaba API. Click "Connect" to establish connection.
              </AlertDescription>
            </Alert>
          )}
          
          {connectionStatus === 'connecting' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Connecting to Alibaba API...
              </AlertDescription>
            </Alert>
          )}
          
          {connectionStatus === 'connected' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully connected to Alibaba API. You can now search and import products.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center space-x-4 mt-4">
            <Button 
              onClick={connectToAlibaba}
              disabled={connectionStatus === 'connecting' || connectionStatus === 'connected'}
            >
              {connectionStatus === 'connecting' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : connectionStatus === 'connected' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Connected
                </>
              ) : (
                'Connect to Alibaba'
              )}
            </Button>
            
            {connectionStatus === 'connected' && (
              <Button variant="outline" onClick={() => setConnectionStatus('disconnected')}>
                Disconnect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Product Search</CardTitle>
          <CardDescription>
            Search for products on Alibaba marketplace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search for electronics, Arduino, sensors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching || !apiConnected}>
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
          
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Development Boards">Development Boards</SelectItem>
                    <SelectItem value="Single Board Computers">Single Board Computers</SelectItem>
                    <SelectItem value="WiFi Modules">WiFi Modules</SelectItem>
                    <SelectItem value="Sensors">Sensors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Price Range ($)</Label>
                <div className="mt-2">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={1000}
                    min={0}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Min Order Quantity</Label>
                <div className="mt-2">
                  <Slider
                    value={minOrderQty}
                    onValueChange={setMinOrderQty}
                    max={100}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-600 mt-1">
                    {minOrderQty[0]} pieces
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Import Progress */}
      {isImporting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Importing Products...</span>
                <span className="text-sm text-gray-600">{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>
                  Found {searchResults.length} products matching your search
                </CardDescription>
              </div>
              
              {selectedProducts.length > 0 && (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {selectedProducts.length} selected
                  </span>
                  <Button onClick={importSelectedProducts} disabled={isImporting}>
                    <Download className="h-4 w-4 mr-2" />
                    Import Selected ({selectedProducts.length})
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence>
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {searchResults.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {searchResults.length === 0 && searchQuery && !isSearching && apiConnected && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AlibabaIntegration;