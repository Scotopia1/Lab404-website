import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { Product } from '@/lib/types';
import WhatsAppButton from './WhatsAppButton';
import { useCartActions, useIsInCart, useItemQuantity } from '@/stores/useCartStore';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  showWhatsApp?: boolean;
}

const ProductCard = ({ product, showWhatsApp = true }: ProductCardProps) => {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addItem } = useCartActions();
  const isInCart = useIsInCart(product.id);
  const cartQuantity = useItemQuantity(product.id);
  
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  
  const savings = product.compareAtPrice ? product.compareAtPrice - product.price : 0;

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      await addItem(product, 1);
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error('Failed to add item to cart');
      console.error('Add to cart error:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };
  
  return (
    <Card 
      className="group bg-white border border-gray-300 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 overflow-hidden h-full flex flex-col focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 rounded-xl"
      role="article"
      aria-labelledby={`product-title-${product.id}`}
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <Link 
          to={`/product/${product.id}`}
          className="block focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm"
          aria-label={`View details for ${product.name}`}
        >
          <div className="w-full h-48 sm:h-56 lg:h-64 xl:h-56 overflow-hidden">
            <OptimizedImage
              src={product.images[0]}
              alt={`${product.name} - Product image showing ${product.description ? product.description.slice(0, 100) + '...' : 'electronic component'}`}
              width={300}
              height={200}
              className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
              fallbackSrc="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22 viewBox=%220 0 300 200%22%3E%3Crect width=%22300%22 height=%22200%22 fill=%22%23f0f0f0%22/%3E%3Ctext x=%22150%22 y=%22100%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23999%22 font-family=%22Arial, sans-serif%22 font-size=%2214%22%3ENo Image%3C/text%3E%3C/svg%3E"
            />
          </div>
        </Link>
        {product.compareAtPrice && (
          <Badge 
            className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 text-xs sm:text-sm font-semibold px-3 py-1.5 shadow-lg"
            aria-label={`Sale: Save ${formatPrice(savings)}`}
          >
            Save {formatPrice(savings)}
          </Badge>
        )}
      </div>

      <CardContent className="p-4 sm:p-5 lg:p-6 flex-grow bg-white">
        <Link 
          to={`/product/${product.id}`}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm"
        >
          <h3 
            id={`product-title-${product.id}`}
            className="font-bold text-gray-900 text-base sm:text-lg lg:text-xl mb-2 line-clamp-2 hover:text-blue-600 transition-colors leading-tight"
          >
            {product.name}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm sm:text-base mb-4 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        <div className="mb-4">
          <div className="flex items-center space-x-2" role="group" aria-label="Pricing information">
            <span 
              className="text-2xl sm:text-3xl font-bold text-blue-600"
              aria-label={`Current price: ${formatPrice(product.price)}`}
            >
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && (
              <span 
                className="text-sm sm:text-base text-gray-400 line-through"
                aria-label={`Original price: ${formatPrice(product.compareAtPrice)}`}
              >
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {product.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs sm:text-sm px-2 py-1">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="p-4 sm:p-5 lg:p-6 pt-0 mt-auto border-t border-gray-100 bg-gray-50">
        <div className="w-full space-y-2" role="group" aria-label="Product actions">
          <Link 
            to={`/product/${product.id}`} 
            className="block w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
            aria-label={`View detailed information for ${product.name}`}
          >
            <Button 
              variant="ghost" 
              className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              View Details →
            </Button>
          </Link>
          
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="h-11 sm:h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 rounded-lg order-2 sm:order-1"
                aria-label={`Add ${product.name} to cart${isInCart ? ` (${cartQuantity} in cart)` : ''}`}
              >
                {isAddingToCart ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate text-sm sm:text-base">
                      {isInCart ? `In Cart (${cartQuantity})` : 'Add to Cart'}
                    </span>
                  </>
                )}
              </Button>

              {showWhatsApp && (
                <div aria-label={`Purchase ${product.name} via WhatsApp`} className="order-1 sm:order-2">
                  <WhatsAppButton
                    product={product}
                    className="h-11 sm:h-12 w-full rounded-lg shadow-md hover:shadow-lg text-sm sm:text-base"
                  />
                </div>
              )}
            </div>

          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;