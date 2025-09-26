import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MessageCircle, ShoppingBag, User, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCartStore, useCartSummary, useCartActions } from '@/stores/useCartStore';
import { toast } from 'sonner';

const guestOrderSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Please enter a valid phone number'),
  address: z.string().min(10, 'Please enter a complete address'),
  notes: z.string().optional(),
});

type GuestOrderForm = z.infer<typeof guestOrderSchema>;

interface GuestOrderFormProps {
  onOrderComplete?: () => void;
  className?: string;
}

export const GuestOrderForm = ({ onOrderComplete, className = '' }: GuestOrderFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { items } = useCartStore();
  const cartSummary = useCartSummary();
  const { clearCart } = useCartActions();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GuestOrderForm>({
    resolver: zodResolver(guestOrderSchema),
  });

  const onSubmit = async (data: GuestOrderForm) => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Generate WhatsApp message with customer info
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
                     `👤 *Customer Information:*\n` +
                     `Name: ${data.name}\n` +
                     `Email: ${data.email}\n` +
                     `Phone: ${data.phone}\n` +
                     `Address: ${data.address}\n` +
                     (data.notes ? `Notes: ${data.notes}\n` : '') +
                     `\n📞 Please confirm this order and we'll process it immediately!`;

      const phoneNumber = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER || '+96176666341';
      const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
      
      // Clear cart and form
      await clearCart();
      reset();
      
      toast.success('Order sent! We\'ll contact you via WhatsApp shortly.');
      
      if (onOrderComplete) {
        onOrderComplete();
      }
    } catch (error) {
      console.error('Order submission error:', error);
      toast.error('Failed to process order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground text-center">
            Add some products to continue with checkout
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Order Summary ({cartSummary.itemCount} items)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center space-x-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-12 h-12 object-cover rounded-md border"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {item.quantity} × ${item.price.toFixed(2)}
                </p>
              </div>
              <div className="font-medium">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
          
          <Separator />
          
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
        </CardContent>
      </Card>

      {/* Customer Information Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  {...register('name')}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+961XXXXXXXX"
                  {...register('phone')}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Delivery Address *
              </Label>
              <Textarea
                id="address"
                placeholder="Enter your complete delivery address"
                rows={3}
                {...register('address')}
                className={errors.address ? 'border-destructive' : ''}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                Order Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions or requests..."
                rows={2}
                {...register('notes')}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full whatsapp-button h-12 text-base font-medium"
            >
              {isSubmitting ? (
                'Processing Order...'
              ) : (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Complete Order via WhatsApp
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By completing this order, you agree to be contacted via WhatsApp for order confirmation and updates.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuestOrderForm;