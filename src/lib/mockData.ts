import { Product } from './types';

export const categories = [
  { id: 'smartphones', name: 'Smartphones', image: "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22 viewBox=%220 0 400 300%22%3E%3Crect width=%22400%22 height=%22300%22 fill=%22%23e3f2fd%22/%3E%3Ctext x=%22200%22 y=%22150%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23666%22 font-family=%22Arial, sans-serif%22 font-size=%2218%22%3ESmartphones%3C/text%3E%3C/svg%3E" },
  { id: 'laptops', name: 'Laptops', image: "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22 viewBox=%220 0 400 300%22%3E%3Crect width=%22400%22 height=%22300%22 fill=%22%23f3e5f5%22/%3E%3Ctext x=%22200%22 y=%22150%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23666%22 font-family=%22Arial, sans-serif%22 font-size=%2218%22%3ELaptops%3C/text%3E%3C/svg%3E" },
  { id: 'accessories', name: 'Accessories', image: "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22 viewBox=%220 0 400 300%22%3E%3Crect width=%22400%22 height=%22300%22 fill=%22%23e8f5e8%22/%3E%3Ctext x=%22200%22 y=%22150%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23666%22 font-family=%22Arial, sans-serif%22 font-size=%2218%22%3EAccessories%3C/text%3E%3C/svg%3E" },
  { id: 'gaming', name: 'Gaming', image: "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22 viewBox=%220 0 400 300%22%3E%3Crect width=%22400%22 height=%22300%22 fill=%22%23fff3e0%22/%3E%3Ctext x=%22200%22 y=%22150%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23666%22 font-family=%22Arial, sans-serif%22 font-size=%2218%22%3EGaming%3C/text%3E%3C/svg%3E" },
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
      "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22 viewBox=%220 0 600 400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%23f5f5f5%22/%3E%3Ctext x=%22300%22 y=%22200%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23666%22 font-family=%22Arial, sans-serif%22 font-size=%2216%22%3EProduct Image%3C/text%3E%3C/svg%3E"
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
      "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22 viewBox=%220 0 600 400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%23f0f0f0%22/%3E%3Ctext x=%22300%22 y=%22200%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23666%22 font-family=%22Arial, sans-serif%22 font-size=%2216%22%3ELaptop Image%3C/text%3E%3C/svg%3E"
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
      "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22 viewBox=%220 0 600 400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%23e8f5e8%22/%3E%3Ccircle cx=%22300%22 cy=%22200%22 r=%2260%22 fill=%22%234caf50%22/%3E%3Ctext x=%22300%22 y=%22170%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23fff%22 font-family=%22Arial, sans-serif%22 font-size=%2232%22 font-weight=%22bold%22%3E1%3C/text%3E%3Ctext x=%22300%22 y=%22250%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23666%22 font-family=%22Arial, sans-serif%22 font-size=%2216%22%3EAccessory Image 1%3C/text%3E%3C/svg%3E",
      "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22 viewBox=%220 0 600 400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%23fff3e0%22/%3E%3Ccircle cx=%22300%22 cy=%22200%22 r=%2260%22 fill=%22%23ff9800%22/%3E%3Ctext x=%22300%22 y=%22170%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23fff%22 font-family=%22Arial, sans-serif%22 font-size=%2232%22 font-weight=%22bold%22%3E2%3C/text%3E%3Ctext x=%22300%22 y=%22250%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23666%22 font-family=%22Arial, sans-serif%22 font-size=%2216%22%3EAccessory Image 2%3C/text%3E%3C/svg%3E"
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
      "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22 viewBox=%220 0 600 400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%23fff3e0%22/%3E%3Ccircle cx=%22300%22 cy=%22200%22 r=%2260%22 fill=%22%23e91e63%22/%3E%3Ctext x=%22300%22 y=%22170%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23fff%22 font-family=%22Arial, sans-serif%22 font-size=%2232%22 font-weight=%22bold%22%3E1%3C/text%3E%3Ctext x=%22300%22 y=%22250%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23666%22 font-family=%22Arial, sans-serif%22 font-size=%2216%22%3EConsole Front View%3C/text%3E%3C/svg%3E",
      "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22 viewBox=%220 0 600 400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%23f3e5f5%22/%3E%3Ccircle cx=%22300%22 cy=%22200%22 r=%2260%22 fill=%22%239c27b0%22/%3E%3Ctext x=%22300%22 y=%22170%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23fff%22 font-family=%22Arial, sans-serif%22 font-size=%2232%22 font-weight=%22bold%22%3E2%3C/text%3E%3Ctext x=%22300%22 y=%22250%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23666%22 font-family=%22Arial, sans-serif%22 font-size=%2216%22%3EConsole Side View%3C/text%3E%3C/svg%3E"
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
      "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22 viewBox=%220 0 600 400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%23f3e5f5%22/%3E%3Ccircle cx=%22300%22 cy=%22200%22 r=%2260%22 fill=%22%233f51b5%22/%3E%3Ctext x=%22300%22 y=%22170%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23fff%22 font-family=%22Arial, sans-serif%22 font-size=%2232%22 font-weight=%22bold%22%3E1%3C/text%3E%3Ctext x=%22300%22 y=%22250%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23666%22 font-family=%22Arial, sans-serif%22 font-size=%2216%22%3EPhone Front View%3C/text%3E%3C/svg%3E",
      "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22 viewBox=%220 0 600 400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%23e8eaf6%22/%3E%3Ccircle cx=%22300%22 cy=%22200%22 r=%2260%22 fill=%22%23673ab7%22/%3E%3Ctext x=%22300%22 y=%22170%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23fff%22 font-family=%22Arial, sans-serif%22 font-size=%2232%22 font-weight=%22bold%22%3E2%3C/text%3E%3Ctext x=%22300%22 y=%22250%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23666%22 font-family=%22Arial, sans-serif%22 font-size=%2216%22%3EPhone Back View%3C/text%3E%3C/svg%3E"
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
      "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22 viewBox=%220 0 600 400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%23e3f2fd%22/%3E%3Ccircle cx=%22300%22 cy=%22200%22 r=%2260%22 fill=%22%232196f3%22/%3E%3Ctext x=%22300%22 y=%22170%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23fff%22 font-family=%22Arial, sans-serif%22 font-size=%2232%22 font-weight=%22bold%22%3E1%3C/text%3E%3Ctext x=%22300%22 y=%22250%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23666%22 font-family=%22Arial, sans-serif%22 font-size=%2216%22%3ELaptop Open View%3C/text%3E%3C/svg%3E",
      "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22 viewBox=%220 0 600 400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%23e1f5fe%22/%3E%3Ccircle cx=%22300%22 cy=%22200%22 r=%2260%22 fill=%22%2300bcd4%22/%3E%3Ctext x=%22300%22 y=%22170%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23fff%22 font-family=%22Arial, sans-serif%22 font-size=%2232%22 font-weight=%22bold%22%3E2%3C/text%3E%3Ctext x=%22300%22 y=%22250%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23666%22 font-family=%22Arial, sans-serif%22 font-size=%2216%22%3ELaptop Closed View%3C/text%3E%3C/svg%3E"
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
export { whatsappConfig } from './env';

// Note: Admin credentials are managed securely in the backend database
// No hardcoded credentials should exist in the frontend