import { useState } from 'react';
import { Search, Download, Edit, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlibabaProduct, ImportedProduct } from '@/lib/types';

// Mock Alibaba product data
const mockAlibabaProducts: AlibabaProduct[] = [
  {
    id: 'ali_001',
    name: 'Wireless Bluetooth Earbuds Pro',
    description: 'High-quality wireless earbuds with active noise cancellation and premium sound quality.',
    price: 89.99,
    moq: 50, // Minimum Order Quantity
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400'
    ],
    videos: ['https://example.com/video1.mp4'],
    specifications: [
      { name: 'Battery Life', value: '8 hours + 24h case' },
      { name: 'Connectivity', value: 'Bluetooth 5.2' },
      { name: 'Water Resistance', value: 'IPX7' },
      { name: 'Driver Size', value: '10mm Dynamic' }
    ],
    supplier: 'Shenzhen Tech Co., Ltd.',
    category: 'accessories',
    tags: ['Wireless', 'Bluetooth', 'Audio']
  },
  {
    id: 'ali_002',
    name: 'Gaming Mechanical Keyboard RGB',
    description: 'Professional gaming keyboard with RGB backlighting and mechanical switches.',
    price: 125.50,
    moq: 20,
    images: [
      'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400',
      'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400'
    ],
    videos: [],
    specifications: [
      { name: 'Switch Type', value: 'Blue Mechanical' },
      { name: 'Backlighting', value: 'RGB LED' },
      { name: 'Connection', value: 'USB-C Wired' },
      { name: 'Key Layout', value: '104 Keys Full Size' }
    ],
    supplier: 'Gaming Gear Manufacturer',
    category: 'gaming',
    tags: ['Gaming', 'Keyboard', 'RGB']
  }
];

interface AlibabaImportProps {
  onImport?: (product: ImportedProduct) => void;
}

const AlibabaImport = ({ onImport }: AlibabaImportProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AlibabaProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AlibabaProduct | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const filtered = mockAlibabaProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setSearchResults(filtered);
      setIsSearching(false);
    }, 1000);
  };

  const handleImport = async (alibabaProduct: AlibabaProduct) => {
    setIsImporting(true);
    
    // Simulate import process
    setTimeout(() => {
      const newProduct: ImportedProduct = {
        id: `imported_${Date.now()}`,
        name: alibabaProduct.name,
        description: alibabaProduct.description,
        price: Math.round(alibabaProduct.price * 1.3), // Add markup
        compareAtPrice: Math.round(alibabaProduct.price * 1.5),
        category: alibabaProduct.category,
        images: alibabaProduct.images,
        specifications: alibabaProduct.specifications,
        tags: alibabaProduct.tags,
        inStock: true,
        featured: false,
        alibabaProductId: alibabaProduct.id,
        supplier: alibabaProduct.supplier,
        moq: alibabaProduct.moq
      };
      
      if (onImport) {
        onImport(newProduct);
      }
      
      setIsImporting(false);
      setSelectedProduct(null);
      
      // Show success message
      alert(`Product "${alibabaProduct.name}" imported successfully!`);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Import from Alibaba</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-6">
            <Input
              placeholder="Search Alibaba products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          <Alert className="mb-6">
            <AlertDescription>
              This is a demo of Alibaba integration. In production, this would connect to the actual Alibaba API 
              to search and import real product data including images, videos, and specifications.
            </AlertDescription>
          </Alert>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Search Results ({searchResults.length})</h3>
              
              {searchResults.map((product) => (
                <Card key={product.id} className="border-l-4 border-l-blue-600">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      
                      {/* Product Image */}
                      <div className="space-y-2">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="text-xs text-gray-500">
                          {product.images.length} images
                          {product.videos.length > 0 && `, ${product.videos.length} videos`}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="md:col-span-2 space-y-3">
                        <h4 className="font-semibold text-lg">{product.name}</h4>
                        <p className="text-gray-600 text-sm line-clamp-3">{product.description}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          {product.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="text-sm text-gray-500">
                          <p><strong>Supplier:</strong> {product.supplier}</p>
                          <p><strong>MOQ:</strong> {product.moq} pieces</p>
                          <p><strong>Category:</strong> {product.category}</p>
                        </div>
                      </div>

                      {/* Price & Actions */}
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            ${product.price}
                          </div>
                          <div className="text-sm text-gray-500">Alibaba Price</div>
                          <div className="text-sm text-blue-600 font-medium">
                            Suggested: ${Math.round(product.price * 1.3)}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button
                            onClick={() => setSelectedProduct(product)}
                            variant="outline"
                            className="w-full"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Preview & Edit
                          </Button>
                          
                          <Button
                            onClick={() => handleImport(product)}
                            disabled={isImporting}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {isImporting ? 'Importing...' : 'Quick Import'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Specifications Preview */}
                    <div className="mt-4 pt-4 border-t">
                      <h5 className="font-medium mb-2">Specifications:</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        {product.specifications.slice(0, 4).map((spec, index) => (
                          <div key={index} className="text-gray-600">
                            <strong>{spec.name}:</strong> {spec.value}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Results */}
          {searchResults.length === 0 && searchQuery && !isSearching && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No products found for "{searchQuery}"</p>
              <p className="text-sm">Try different keywords or check spelling</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Preview Modal (simplified) */}
      {selectedProduct && (
        <Card className="border-2 border-blue-600">
          <CardHeader className="bg-blue-50">
            <div className="flex items-center justify-between">
              <CardTitle>Edit Product Before Import</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProduct(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedProduct.images[0]}
                  alt={selectedProduct.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <p className="text-sm text-gray-600 mb-4">{selectedProduct.description}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Product Name</label>
                  <Input defaultValue={selectedProduct.name} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Cost Price</label>
                    <Input defaultValue={selectedProduct.price} type="number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Selling Price</label>
                    <Input defaultValue={Math.round(selectedProduct.price * 1.3)} type="number" />
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button
                    onClick={() => handleImport(selectedProduct)}
                    disabled={isImporting}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {isImporting ? 'Importing...' : 'Import Product'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AlibabaImport;