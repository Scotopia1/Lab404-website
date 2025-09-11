import { Product } from '@/lib/types';

export interface CustomerInfo {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  specifications?: { name: string; value: string }[];
  sku?: string;
}

export interface OrderSummary {
  items: CartItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
}

export interface WhatsAppConfig {
  businessName: string;
  phoneNumber: string;
  supportHours: string;
  website?: string;
  location?: string;
  defaultMessage?: string;
}

export interface WhatsAppTemplate {
  name: string;
  template: string;
  description: string;
  useCase: 'order' | 'inquiry' | 'support' | 'welcome';
}

export class WhatsAppService {
  private config: WhatsAppConfig;
  private templates: Map<string, WhatsAppTemplate>;

  constructor(config: WhatsAppConfig) {
    this.config = config;
    this.templates = new Map();
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    const defaultTemplates: WhatsAppTemplate[] = [
      {
        name: 'order',
        useCase: 'order',
        description: 'Complete order with customer details and items',
        template: `🛒 *New Order from {{businessName}}*
{{separator}}

{{#customerInfo}}
👤 *Customer Information:*
{{#name}}Name: {{name}}{{/name}}
{{#email}}Email: {{email}}{{/email}}
{{#phone}}Phone: {{phone}}{{/phone}}
{{#address}}Address: {{address}}{{/address}}
{{#notes}}Notes: {{notes}}{{/notes}}

{{/customerInfo}}
🛍️ *Order Details:*
{{#items}}
📱 *{{name}}*
{{#sku}}   SKU: {{sku}}{{/sku}}
   Quantity: {{quantity}}
   Unit Price: {{currency}}{{price}}
   Subtotal: {{currency}}{{itemTotal}}
{{#specifications}}
   - {{name}}: {{value}}{{/specifications}}

{{/items}}
{{separator}}
💰 *Order Summary:*
Subtotal: {{currency}}{{subtotal}}
{{#tax}}Tax ({{taxRate}}%): {{currency}}{{tax}}{{/tax}}
{{#shipping}}Shipping: {{currency}}{{shipping}}{{/shipping}}
{{#discount}}Discount: -{{currency}}{{discount}}{{/discount}}
**Total: {{currency}}{{total}}**

📦 Items: {{totalItems}}
🕐 Order Date: {{date}}

{{#website}}🌐 Order Reference: {{website}}/order/{{orderId}}{{/website}}

📞 Please confirm this order and we'll process it immediately!

*{{businessName}}*
{{#supportHours}}Support Hours: {{supportHours}}{{/supportHours}}`
      },
      {
        name: 'product-inquiry',
        useCase: 'inquiry',
        description: 'Product inquiry with details',
        template: `Hi {{businessName}}! 👋

I'm interested in this product:

📱 *{{productName}}*
💰 Price: {{currency}}{{price}}
{{#productSpecs}}
📋 Specifications:
{{#specifications}}• {{name}}: {{value}}
{{/specifications}}
{{/productSpecs}}

🔗 Product Link: {{productUrl}}

Could you provide more information about:
• Availability and stock status
• Shipping options and costs
• Warranty details
• Technical support

{{#customerInfo}}
My contact details:
{{#name}}Name: {{name}}{{/name}}
{{#phone}}Phone: {{phone}}{{/phone}}
{{#email}}Email: {{email}}{{/email}}
{{/customerInfo}}

Thank you!`
      },
      {
        name: 'quick-order',
        useCase: 'order',
        description: 'Simple order without extensive details',
        template: `🛒 *Quick Order - {{businessName}}*

{{#items}}
• {{name}} (x{{quantity}}) - {{currency}}{{price}}
{{/items}}

**Total: {{currency}}{{total}}**

Please confirm availability and total cost including shipping.

Thank you! 🙏`
      },
      {
        name: 'support',
        useCase: 'support',
        description: 'General support inquiry',
        template: `🆘 *Support Request - {{businessName}}*

{{#customerInfo}}
Customer: {{name}}
{{#phone}}Phone: {{phone}}{{/phone}}
{{#email}}Email: {{email}}{{/email}}
{{/customerInfo}}

Issue: {{subject}}

Description:
{{message}}

{{#orderReference}}Order Reference: {{orderReference}}{{/orderReference}}

Please assist when possible. Thank you!`
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.name, template);
    });
  }

  public generateOrderMessage(
    orderSummary: OrderSummary,
    customerInfo?: CustomerInfo,
    template: string = 'order'
  ): string {
    const templateObj = this.templates.get(template);
    if (!templateObj) {
      throw new Error(`Template "${template}" not found`);
    }

    const context = this.buildOrderContext(orderSummary, customerInfo);
    return this.processTemplate(templateObj.template, context);
  }

  public generateProductInquiry(
    product: Product,
    customerInfo?: CustomerInfo,
    customMessage?: string
  ): string {
    const template = this.templates.get('product-inquiry')!;
    
    const context = {
      businessName: this.config.businessName,
      productName: product.name,
      price: product.price.toFixed(2),
      currency: '$',
      productUrl: `${this.config.website || window.location.origin}/product/${product.id}`,
      productSpecs: product.specifications && product.specifications.length > 0,
      specifications: product.specifications || [],
      customerInfo: customerInfo && Object.keys(customerInfo).some(key => customerInfo[key as keyof CustomerInfo]),
      ...customerInfo,
      customMessage
    };

    return this.processTemplate(template.template, context);
  }

  public generateQuickOrder(items: CartItem[], total: number): string {
    const template = this.templates.get('quick-order')!;
    
    const context = {
      businessName: this.config.businessName,
      items: items.map(item => ({
        ...item,
        price: item.price.toFixed(2)
      })),
      total: total.toFixed(2),
      currency: '$'
    };

    return this.processTemplate(template.template, context);
  }

  public generateSupportMessage(
    subject: string,
    message: string,
    customerInfo?: CustomerInfo,
    orderReference?: string
  ): string {
    const template = this.templates.get('support')!;
    
    const context = {
      businessName: this.config.businessName,
      subject,
      message,
      customerInfo: customerInfo && Object.keys(customerInfo).some(key => customerInfo[key as keyof CustomerInfo]),
      ...customerInfo,
      orderReference
    };

    return this.processTemplate(template.template, context);
  }

  public openChat(message: string, phoneNumber?: string): void {
    const phone = phoneNumber || this.config.phoneNumber;
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming Lebanon +961)
    const formattedPhone = cleanPhone.startsWith('961') ? cleanPhone : `961${cleanPhone}`;
    
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    
    // Track WhatsApp interaction
    this.trackWhatsAppInteraction('chat_opened', { phone: formattedPhone, messageLength: message.length });
    
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  public generateShareLink(message: string): string {
    const encodedMessage = encodeURIComponent(message);
    return `whatsapp://send?text=${encodedMessage}`;
  }

  public addCustomTemplate(template: WhatsAppTemplate): void {
    this.templates.set(template.name, template);
  }

  public getTemplate(name: string): WhatsAppTemplate | undefined {
    return this.templates.get(name);
  }

  public getAllTemplates(): WhatsAppTemplate[] {
    return Array.from(this.templates.values());
  }

  public validatePhoneNumber(phone: string): boolean {
    // Basic phone number validation for Lebanese numbers
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Lebanese mobile: +961 xx xxx xxx or +961 xxx xxx (8 or 9 digits after country code)
    // Lebanese landline: +961 x xxx xxx (7-8 digits after country code)
    return (
      cleanPhone.length >= 10 && // Minimum international format
      cleanPhone.length <= 15 && // Maximum international format
      /^(961|0)?[1-9]\d{6,8}$/.test(cleanPhone) // Lebanese format
    );
  }

  public formatPhoneNumber(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.startsWith('961')) {
      // Already has country code
      return `+${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 5)} ${cleanPhone.slice(5, 8)} ${cleanPhone.slice(8)}`;
    } else if (cleanPhone.startsWith('0')) {
      // Lebanese local format
      return `+961 ${cleanPhone.slice(1, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`;
    } else {
      // Assume Lebanese without leading 0
      return `+961 ${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 5)} ${cleanPhone.slice(5)}`;
    }
  }

  private buildOrderContext(orderSummary: OrderSummary, customerInfo?: CustomerInfo) {
    const orderId = this.generateOrderId();
    
    return {
      businessName: this.config.businessName,
      website: this.config.website,
      supportHours: this.config.supportHours,
      orderId,
      separator: '━'.repeat(30),
      customerInfo: customerInfo && Object.keys(customerInfo).some(key => customerInfo[key as keyof CustomerInfo]),
      ...customerInfo,
      items: orderSummary.items.map(item => ({
        ...item,
        price: item.price.toFixed(2),
        itemTotal: (item.price * item.quantity).toFixed(2),
        specifications: item.specifications && item.specifications.length > 0
      })),
      subtotal: orderSummary.subtotal.toFixed(2),
      tax: orderSummary.tax > 0 ? orderSummary.tax.toFixed(2) : null,
      taxRate: orderSummary.taxRate,
      shipping: orderSummary.shipping > 0 ? orderSummary.shipping.toFixed(2) : null,
      discount: orderSummary.discount > 0 ? orderSummary.discount.toFixed(2) : null,
      total: orderSummary.total.toFixed(2),
      currency: orderSummary.currency,
      totalItems: orderSummary.items.reduce((sum, item) => sum + item.quantity, 0),
      date: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Beirut'
      })
    };
  }

  private processTemplate(template: string, context: any): string {
    // Simple template processor supporting Mustache-like syntax
    let result = template;

    // Process sections ({{#section}}...{{/section}})
    result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, section, content) => {
      const value = context[section];
      if (!value) return '';
      
      if (Array.isArray(value)) {
        return value.map(item => this.processTemplate(content, { ...context, ...item })).join('');
      } else if (typeof value === 'boolean' && value) {
        return this.processTemplate(content, context);
      } else if (typeof value === 'object') {
        return this.processTemplate(content, { ...context, ...value });
      }
      
      return value ? this.processTemplate(content, context) : '';
    });

    // Process variables ({{variable}})
    result = result.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return context[variable] || '';
    });

    return result.trim();
  }

  private generateOrderId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ORD-${timestamp}-${random}`.toUpperCase();
  }

  private trackWhatsAppInteraction(event: string, data: any) {
    // Integration point for analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, {
        event_category: 'whatsapp',
        event_label: 'customer_interaction',
        custom_parameters: data
      });
    }

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('WhatsApp Interaction:', event, data);
    }
  }
}

// Default configuration for Lebanon/LAB404
export const createLAB404WhatsAppService = () => {
  const config: WhatsAppConfig = {
    businessName: 'LAB404 Electronics',
    phoneNumber: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER || '+96176666341',
    supportHours: 'Mon-Sat 9:00 AM - 8:00 PM (Beirut Time)',
    website: import.meta.env.VITE_WEBSITE_URL || 'https://lab404.com',
    location: 'Beirut, Lebanon'
  };

  return new WhatsAppService(config);
};

export default WhatsAppService;