import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Product } from '@/lib/mockData';
import WhatsAppButton from './WhatsAppButton';

interface ProductCardProps {
  product: Product;
  showWhatsApp?: boolean;
}

const ProductCard = ({ product, showWhatsApp = true }: ProductCardProps) => {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
      <div className="relative overflow-hidden">
        <Link to={`/product/${product.id}`}>
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-48 sm:h-56 lg:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        {product.compareAtPrice && (
          <Badge className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-xs sm:text-sm">
            Save ${product.compareAtPrice - product.price}
          </Badge>
        )}
        {!product.inStock && (
          <Badge variant="secondary" className="absolute top-2 right-2 text-xs sm:text-sm">
            Out of Stock
          </Badge>
        )}
      </div>

      <CardContent className="p-3 sm:p-4 lg:p-5 flex-grow">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-base sm:text-lg mb-2 line-clamp-2 hover:text-blue-600 transition-colors leading-tight">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">
              ${product.price}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-gray-500 line-through">
                ${product.compareAtPrice}
              </span>
            )}
          </div>
          <Badge variant="outline" className="text-xs uppercase">
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
        <div className="w-full space-y-2">
          <Link to={`/product/${product.id}`} className="block w-full">
            <Button 
              variant="outline" 
              className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium border-gray-300 hover:border-blue-600 hover:text-blue-600 transition-all duration-200"
            >
              View Details
            </Button>
          </Link>
          
          {showWhatsApp && product.inStock && (
            <WhatsAppButton 
              product={product} 
              className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium" 
            />
          )}
          
          {!product.inStock && (
            <Button 
              disabled 
              className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
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