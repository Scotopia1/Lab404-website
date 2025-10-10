import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, ShoppingBag, Trash2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useCartStore, useCartSummary, useCartActions } from '@/stores/useCartStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const navigate = useNavigate();
  const { items } = useCartStore();
  const cartSummary = useCartSummary();
  const { updateQuantity, removeItem, clearCart } = useCartActions();
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const handleQuantityUpdate = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeItem(itemId);
    } else {
      await updateQuantity(itemId, newQuantity);
    }
  };

  const handleWhatsAppOrder = () => {
    setIsProcessingOrder(true);

    // Generate WhatsApp message
    const itemsList = items.map(item =>
      `📱 *${item.name}*\n` +
      `   Quantity: ${item.quantity}\n` +
      `   Unit Price: $${item.price.toFixed(2)}\n` +
      `   Subtotal: $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n\n');

    const message = `🛒 *New Order from LAB404*\n` +
                   `${'━'.repeat(30)}\n\n` +
                   `${itemsList}\n\n` +
                   `${'━'.repeat(30)}\n` +
                   `💰 *Total: $${cartSummary.total.toFixed(2)}*\n` +
                   `📦 Items: ${cartSummary.itemCount}\n\n` +
                   `📞 Please confirm this order and we'll process it immediately!`;

    const phoneNumber = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER || '+96176666341';
    const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
    setIsProcessingOrder(false);
    onClose();
  };

  const handleGoToCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Your Cart
            </SheetTitle>
            <SheetDescription>
              Review your items before checkout
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground text-center mb-6">
              Add some products to get started
            </p>
            <Button onClick={onClose} variant="outline">
              Continue Shopping
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Cart ({cartSummary.itemCount})
          </SheetTitle>
          <SheetDescription>
            Review your items before checkout
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-6">
          <div className="space-y-4 py-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-start space-x-4 group">
                <div className="relative flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-md border"
                  />
                  {!item.inStock && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 text-xs px-1"
                    >
                      Out
                    </Badge>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2 mb-1">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm">
                      ${item.price.toFixed(2)}
                    </span>
                    {item.compareAtPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        ${item.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleQuantityUpdate(item.id, item.quantity - 1)}
                        disabled={!item.inStock}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-medium text-sm w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)}
                        disabled={!item.inStock || (item.maxQuantity && item.quantity >= item.maxQuantity)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="space-y-4 pt-4 border-t">
          {/* Cart Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${cartSummary.subtotal.toFixed(2)}</span>
            </div>
            {cartSummary.shipping > 0 && (
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>${cartSummary.shipping.toFixed(2)}</span>
              </div>
            )}
            {cartSummary.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${cartSummary.tax.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${cartSummary.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout Actions */}
          <div className="space-y-2">
            <Button
              onClick={handleGoToCheckout}
              disabled={items.some(item => !item.inStock)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Checkout (Cash on Delivery)
            </Button>

            <Button
              onClick={handleWhatsAppOrder}
              disabled={isProcessingOrder || items.some(item => !item.inStock)}
              variant="outline"
              className="w-full whatsapp-button"
            >
              {isProcessingOrder ? (
                'Processing...'
              ) : (
                'Order via WhatsApp'
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;