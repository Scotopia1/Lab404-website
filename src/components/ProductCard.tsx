import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
    if (!product.inStock) return;
    
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
      className="group hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
      role="article"
      aria-labelledby={`product-title-${product.id}`}
    >
      <div className="relative overflow-hidden">
        <Link 
          to={`/product/${product.id}`}
          className="block focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm"
          aria-label={`View details for ${product.name}`}
        >
          <img
            src={product.images[0]}
            alt={`${product.name} - Product image showing ${product.description ? product.description.slice(0, 100) + '...' : 'electronic component'}`}
            className="w-full h-48 sm:h-56 lg:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </Link>
        {product.compareAtPrice && (
          <Badge 
            className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-xs sm:text-sm"
            aria-label={`Sale: Save ${formatPrice(savings)}`}
          >
            Save {formatPrice(savings)}
          </Badge>
        )}
        {!product.inStock && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 text-xs sm:text-sm"
            aria-label="Stock status: Out of stock"
          >
            Out of Stock
          </Badge>
        )}
        {product.inStock && (
          <Badge 
            className="absolute top-2 right-2 bg-green-600 text-xs sm:text-sm sr-only"
            aria-label="Stock status: In stock"
          >
            In Stock
          </Badge>
        )}
      </div>

      <CardContent className="p-3 sm:p-4 lg:p-5 flex-grow">
        <Link 
          to={`/product/${product.id}`}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm"
        >
          <h3 
            id={`product-title-${product.id}`}
            className="font-semibold text-base sm:text-lg mb-2 line-clamp-2 hover:text-blue-600 transition-colors leading-tight"
          >
            {product.name}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2" role="group" aria-label="Pricing information">
            <span 
              className="text-xl sm:text-2xl font-bold text-gray-900"
              aria-label={`Current price: ${formatPrice(product.price)}`}
            >
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && (
              <span 
                className="text-sm text-gray-500 line-through"
                aria-label={`Original price: ${formatPrice(product.compareAtPrice)}`}
              >
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          <Badge 
            variant="outline" 
            className="text-xs uppercase"
            aria-label={`Category: ${product.category}`}
          >
            {product.category}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {product.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="p-3 sm:p-4 lg:p-5 pt-0 mt-auto">
        <div className="w-full space-y-2" role="group" aria-label="Product actions">
          <Link 
            to={`/product/${product.id}`} 
            className="block w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
            aria-label={`View detailed information for ${product.name}`}
          >
            <Button 
              variant="outline" 
              className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium border-gray-300 hover:border-blue-600 hover:text-blue-600 transition-all duration-200"
            >
              View Details
            </Button>
          </Link>
          
          {product.inStock ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="cart-button h-10 sm:h-11 text-sm sm:text-base font-medium flex items-center justify-center"
                aria-label={`Add ${product.name} to cart${isInCart ? ` (${cartQuantity} in cart)` : ''}`}
              >
                {isAddingToCart ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-1.5" />
                    {isInCart ? `${cartQuantity}` : 'Add'}
                  </>
                )}
              </Button>
              
              {showWhatsApp && (
                <div aria-label={`Purchase ${product.name} via WhatsApp`}>
                  <WhatsAppButton 
                    product={product} 
                    className="h-10 sm:h-11 text-sm sm:text-base font-medium" 
                  />
                </div>
              )}
            </div>
          ) : (
            <Button 
              disabled 
              className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
              aria-label={`${product.name} is currently out of stock`}
            >
              Out of Stock
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;