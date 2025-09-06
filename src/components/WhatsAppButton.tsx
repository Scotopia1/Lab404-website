import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, whatsappConfig } from '@/lib/mockData';

interface WhatsAppButtonProps {
  product: Product;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
}

const WhatsAppButton = ({ product, className, variant = 'default' }: WhatsAppButtonProps) => {
  const generateWhatsAppMessage = () => {
    const message = `Hello ${whatsappConfig.businessName}! 👋

I'm interested in this product:

📱 *${product.name}*
💰 Price: $${product.price}
🔗 Link: ${window.location.origin}/product/${product.id}

Could you please provide more information about:
• Availability and stock status
• Shipping options and delivery time
• Warranty details
• Any current promotions

Thank you!`;

    return encodeURIComponent(message);
  };

  const handleWhatsAppClick = () => {
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${whatsappConfig.phoneNumber.replace('+', '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button
      onClick={handleWhatsAppClick}
      variant={variant}
      className={`bg-green-600 hover:bg-green-700 text-white transition-all duration-200 active:scale-95 flex items-center justify-center ${className}`}
    >
      <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
      <span className="truncate font-medium">Buy via WhatsApp</span>
    </Button>
  );
};

export default WhatsAppButton;