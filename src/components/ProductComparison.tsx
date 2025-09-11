import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  BarChart3, 
  Star, 
  ShoppingCart, 
  Eye, 
  Download, 
  Share2,
  ArrowLeftRight,
  CheckCircle,
  XCircle,
  Package,
  DollarSign,
  Award,
  Zap
} from 'lucide-react';
import { useComparisonStore, useComparisonProducts, useComparisonCount, useComparisonOpen } from '@/stores/useComparisonStore';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { createLAB404WhatsAppService } from '@/lib/whatsapp/WhatsAppService';
import { toast } from 'sonner';

interface ProductComparisonProps {
  className?: string;
}

// Comparison table row component
const ComparisonRow: React.FC<{
  label: string;
  values: any[];
  type?: 'text' | 'price' | 'rating' | 'boolean' | 'badge';
  icon?: React.ComponentType<{ className?: string }>;
}> = ({ label, values, type = 'text', icon: Icon }) => {
  const renderValue = (value: any, index: number) => {
    switch (type) {
      case 'price':
        return (
          <span className="font-semibold text-lg text-green-600">
            ${typeof value === 'number' ? value.toFixed(2) : '—'}
          </span>
        );
      case 'rating':
        if (!value || value === 0) return <span className="text-gray-400">—</span>;
        return (
          <div className="flex items-center gap-1">
            <div className="flex">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({value.toFixed(1)})</span>
          </div>
        );
      case 'boolean':
        return value ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500" />
        );
      case 'badge':
        return value ? (
          <Badge variant="outline" className="text-xs">
            {value}
          </Badge>
        ) : (
          <span className="text-gray-400">—</span>
        );
      default:
        return value || <span className="text-gray-400">—</span>;
    }
  };

  return (
    <TableRow>
      <TableHead className="font-medium flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-gray-500" />}
        {label}
      </TableHead>
      {values.map((value, index) => (
        <TableCell key={index} className="text-center">
          {renderValue(value, index)}
        </TableCell>
      ))}
    </TableRow>
  );
};

// Main comparison component
export const ProductComparison: React.FC<ProductComparisonProps> = ({ className = '' }) => {
  const products = useComparisonProducts();
  const count = useComparisonCount();
  const isOpen = useComparisonOpen();
  const { removeProduct, clearAll, setOpen, getComparableFields, exportComparison } = useComparisonStore();
  const [showFullTable, setShowFullTable] = useState(false);

  const whatsappService = useMemo(() => createLAB404WhatsAppService(), []);

  // Generate comparison data
  const comparisonData = useMemo(() => {
    const fields = getComparableFields();
    const rows: Array<{ label: string; values: any[]; type?: string; icon?: any }> = [];

    // Basic info rows
    rows.push({
      label: 'Price',
      values: products.map(p => p.price),
      type: 'price',
      icon: DollarSign
    });

    rows.push({
      label: 'Category',
      values: products.map(p => p.category),
      type: 'badge',
      icon: Package
    });

    rows.push({
      label: 'Brand',
      values: products.map(p => p.brand || '—'),
      type: 'badge',
      icon: Award
    });

    rows.push({
      label: 'Rating',
      values: products.map(p => p.rating || 0),
      type: 'rating',
      icon: Star
    });

    rows.push({
      label: 'In Stock',
      values: products.map(p => p.inStock),
      type: 'boolean',
      icon: CheckCircle
    });

    rows.push({
      label: 'Featured',
      values: products.map(p => p.featured),
      type: 'boolean',
      icon: Zap
    });

    // Specifications
    const specKeys = fields.filter(field => 
      !['price', 'category', 'brand', 'rating', 'inStock', 'featured'].includes(field)
    );

    specKeys.forEach(specKey => {
      const values = products.map(product => {
        const spec = product.specifications?.find(s => s.name === specKey);
        return spec?.value || '—';
      });

      rows.push({
        label: specKey,
        values,
        type: 'text'
      });
    });

    return rows;
  }, [products, getComparableFields]);

  const handleExport = useCallback(() => {
    try {
      const data = exportComparison();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-comparison-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Comparison exported successfully');
    } catch (error) {
      toast.error('Failed to export comparison');
    }
  }, [exportComparison]);

  const handleShare = useCallback(() => {
    const productNames = products.map(p => p.name).join(', ');
    const message = whatsappService.generateQuickOrder(
      products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        quantity: 1
      })),
      products.reduce((sum, p) => sum + p.price, 0)
    );

    whatsappService.openChat(
      `I'm comparing these products and would like more information:\n\n${message}`
    );
  }, [products, whatsappService]);

  const handleAddToCart = useCallback((productId: string) => {
    // This would integrate with your cart store
    toast.success('Added to cart');
  }, []);

  if (count === 0) {
    return null;
  }

  const ComparisonContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6" />
            Product Comparison
          </h2>
          <p className="text-gray-600">
            Comparing {count} product{count !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear All
          </Button>
        </div>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {products.map((product) => (
          <Card key={product.id} className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 z-10"
              onClick={() => removeProduct(product.id)}
              aria-label={`Remove ${product.name} from comparison`}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <CardHeader className="pb-2">
              <OptimizedImage
                src={product.images[0]}
                alt={product.name}
                width={200}
                height={200}
                className="w-full h-32 object-cover rounded"
              />
            </CardHeader>
            
            <CardContent>
              <h3 className="font-semibold line-clamp-2 mb-2">{product.name}</h3>
              <div className="text-2xl font-bold text-green-600 mb-2">
                ${product.price.toFixed(2)}
              </div>
              
              {product.rating > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < product.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-600">({product.rating})</span>
                </div>
              )}
              
              <div className="flex gap-2 mb-3">
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
                {product.brand && (
                  <Badge variant="secondary" className="text-xs">
                    {product.brand}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!product.inStock}
                  onClick={() => handleAddToCart(product.id)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Detailed Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Feature</TableHead>
                  {products.map((product) => (
                    <TableHead key={product.id} className="text-center min-w-[150px]">
                      <div className="font-semibold line-clamp-2">
                        {product.name}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonData.map((row, index) => (
                  <ComparisonRow
                    key={index}
                    label={row.label}
                    values={row.values}
                    type={row.type}
                    icon={row.icon}
                  />
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {/* Mobile Sheet */}
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[90vh] md:hidden">
          <SheetHeader>
            <SheetTitle>Product Comparison</SheetTitle>
            <SheetDescription>
              Compare features and specifications
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-full mt-4">
            <ComparisonContent />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Desktop Dialog */}
      <Dialog open={isOpen && window.innerWidth >= 768} onOpenChange={setOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Product Comparison</DialogTitle>
            <DialogDescription>
              Compare features and specifications side by side
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-full max-h-[70vh]">
            <ComparisonContent />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Floating Comparison Button */}
      {count > 0 && !isOpen && (
        <Button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 rounded-full h-12 px-4 shadow-lg"
          size="lg"
        >
          <ArrowLeftRight className="h-5 w-5 mr-2" />
          Compare ({count})
        </Button>
      )}
    </>
  );
};

// Comparison toggle button for product cards
export const ComparisonButton: React.FC<{ 
  productId: string;
  product?: any;
  className?: string;
}> = ({ productId, product, className = '' }) => {
  const { addProduct, removeProduct, isInComparison, canAddMore } = useComparisonStore();
  const inComparison = isInComparison(productId);
  const canAdd = canAddMore();

  const handleToggle = useCallback(() => {
    if (inComparison) {
      removeProduct(productId);
      toast.success('Removed from comparison');
    } else if (product) {
      const success = addProduct(product);
      if (success) {
        toast.success('Added to comparison');
      } else {
        toast.error('Cannot add more products to comparison');
      }
    }
  }, [inComparison, productId, product, addProduct, removeProduct]);

  return (
    <Button
      variant={inComparison ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={!inComparison && !canAdd}
      className={className}
      aria-label={`${inComparison ? 'Remove from' : 'Add to'} comparison`}
    >
      <ArrowLeftRight className="h-4 w-4 mr-2" />
      {inComparison ? 'In Comparison' : 'Compare'}
    </Button>
  );
};

export default ProductComparison;