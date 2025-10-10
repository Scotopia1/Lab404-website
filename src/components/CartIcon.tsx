import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartItemCount } from '@/stores/useCartStore';

interface CartIconProps {
  onClick?: () => void;
  className?: string;
}

export const CartIcon = ({ onClick, className = '' }: CartIconProps) => {
  const itemCount = useCartItemCount();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`relative h-10 w-10 p-0 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors ${className}`}
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-semibold min-w-[1.25rem]"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      )}
    </Button>
  );
};

export default CartIcon;