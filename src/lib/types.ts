export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand?: string;
  image: string;
  inStock: boolean;
  createdAt?: string;
}

export interface AlibabaProduct {
  id: string;
  title: string;
  price: {
    min: number;
    max: number;
    currency: string;
  };
  minOrderQuantity: number;
  supplier: {
    name: string;
    rating: number;
    location: string;
    responseRate: string;
    onTimeDelivery: string;
  };
  images: string[];
  category: string;
  description: string;
  specifications: Record<string, string>;
  shipping: {
    methods: string[];
    time: string;
    cost: string;
  };
  certifications: string[];
}

export interface WhatsAppConfig {
  phoneNumber: string;
  message: string;
}