import { Product } from './types';

export const categories = [
  { id: 'smartphones', name: 'Smartphones', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400' },
  { id: 'laptops', name: 'Laptops', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400' },
  { id: 'accessories', name: 'Accessories', image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400' },
  { id: 'gaming', name: 'Gaming', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400' },
];

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro Max',
    description: 'The most advanced iPhone ever with titanium design, A17 Pro chip, and professional camera system.',
    price: 1199,
    compareAtPrice: 1299,
    category: 'smartphones',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600',
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600'
    ],
    specifications: [
      { name: 'Display', value: '6.7-inch Super Retina XDR' },
      { name: 'Chip', value: 'A17 Pro' },
      { name: 'Storage', value: '256GB' },
      { name: 'Camera', value: '48MP Main + 12MP Ultra Wide' }
    ],
    tags: ['Apple', 'Smartphone', 'Premium'],
    inStock: true,
    featured: true
  },
  {
    id: '2',
    name: 'MacBook Pro 14"',
    description: 'Supercharged by M3 Pro chip. Perfect for professionals who demand the best performance.',
    price: 2499,
    compareAtPrice: 2699,
    category: 'laptops',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'
    ],
    specifications: [
      { name: 'Chip', value: 'Apple M3 Pro' },
      { name: 'Memory', value: '18GB Unified Memory' },
      { name: 'Storage', value: '512GB SSD' },
      { name: 'Display', value: '14.2-inch Liquid Retina XDR' }
    ],
    tags: ['Apple', 'Laptop', 'Professional'],
    inStock: true,
    featured: true
  },
  {
    id: '3',
    name: 'AirPods Pro (2nd Gen)',
    description: 'Next-level Active Noise Cancellation and Adaptive Transparency for the ultimate listening experience.',
    price: 249,
    category: 'accessories',
    images: [
      'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600',
      'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600'
    ],
    specifications: [
      { name: 'Chip', value: 'H2 chip' },
      { name: 'Battery', value: 'Up to 6 hours listening time' },
      { name: 'Features', value: 'Active Noise Cancellation' },
      { name: 'Connectivity', value: 'Bluetooth 5.3' }
    ],
    tags: ['Apple', 'Wireless', 'Audio'],
    inStock: true,
    featured: false
  },
  {
    id: '4',
    name: 'PlayStation 5',
    description: 'Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with haptic feedback.',
    price: 499,
    category: 'gaming',
    images: [
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600',
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600'
    ],
    specifications: [
      { name: 'CPU', value: 'AMD Zen 2, 8 Cores' },
      { name: 'GPU', value: 'AMD RDNA 2' },
      { name: 'Memory', value: '16GB GDDR6' },
      { name: 'Storage', value: '825GB SSD' }
    ],
    tags: ['Sony', 'Gaming', 'Console'],
    inStock: true,
    featured: true
  },
  {
    id: '5',
    name: 'Samsung Galaxy S24 Ultra',
    description: 'The ultimate Android flagship with S Pen, 200MP camera, and AI-powered features.',
    price: 1299,
    category: 'smartphones',
    images: [
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600',
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600'
    ],
    specifications: [
      { name: 'Display', value: '6.8-inch Dynamic AMOLED 2X' },
      { name: 'Processor', value: 'Snapdragon 8 Gen 3' },
      { name: 'Storage', value: '256GB' },
      { name: 'Camera', value: '200MP Main + 50MP Periscope' }
    ],
    tags: ['Samsung', 'Android', 'Premium'],
    inStock: true,
    featured: false
  },
  {
    id: '6',
    name: 'Dell XPS 13',
    description: 'Ultra-portable laptop with stunning InfinityEdge display and premium build quality.',
    price: 1199,
    category: 'laptops',
    images: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600'
    ],
    specifications: [
      { name: 'Processor', value: 'Intel Core i7-1360P' },
      { name: 'Memory', value: '16GB LPDDR5' },
      { name: 'Storage', value: '512GB SSD' },
      { name: 'Display', value: '13.4-inch FHD+' }
    ],
    tags: ['Dell', 'Ultrabook', 'Portable'],
    inStock: true,
    featured: false
  }
];

// Export configurations for backward compatibility (now managed by env.ts)
export { whatsappConfig, adminConfig as adminUser } from './env';