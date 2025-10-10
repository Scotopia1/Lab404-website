import { Product } from '@/lib/types';

// Simplified Alibaba product interface focused on content only
export interface AlibabaProductContent {
  id: string;
  title: string;
  description: string;
  images: string[];
  videos?: string[];
  category: string;
  specifications: Record<string, string>;
  tags: string[];
  brand?: string;
  features?: string[];
}

export interface AlibabaSearchResult {
  products: AlibabaProductContent[];
  total: number;
  page: number;
  totalPages: number;
  query: string;
}

export interface ContentImportOptions {
  priceMarkup?: number; // Percentage markup to apply (e.g., 1.3 for 30% markup)
  targetCategory?: string; // Override category
  addTags?: string[]; // Additional tags to add
  setPriceTo?: number; // Set specific price instead of using markup
}

export interface ImportResult {
  success: boolean;
  product?: Product;
  errors?: string[];
  importId?: string;
}

export interface BulkImportResult {
  successful: ImportResult[];
  failed: ImportResult[];
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

// Rate limiting configuration
const RATE_LIMIT = {
  tokensPerInterval: 60, // 60 requests
  interval: 60000, // per minute
  maxRetries: 3,
  retryDelay: 1000
};

/**
 * Streamlined Alibaba API service focused on content import only
 * Excludes supplier management, stock levels, and complex business logic
 */
export class AlibabaContentAPI {
  private apiKey: string;
  private baseURL: string;
  private requestCount: number = 0;
  private lastResetTime: number = Date.now();

  constructor() {
    this.apiKey = import.meta.env.VITE_ALIBABA_API_KEY || 'demo-key';
    this.baseURL = import.meta.env.VITE_ALIBABA_API_URL || 'https://api.alibaba.com/v1';
    
    if (!this.apiKey || this.apiKey === 'demo-key') {
      console.warn('⚠️ Using demo mode: Set VITE_ALIBABA_API_KEY for production');
    }
  }

  /**
   * Search for products by keyword, returning only content data
   */
  async searchProductContent(
    query: string,
    options: {
      category?: string;
      page?: number;
      limit?: number;
      country?: string;
    } = {}
  ): Promise<AlibabaSearchResult> {
    try {
      await this.checkRateLimit();

      // In demo mode, return mock data
      if (this.apiKey === 'demo-key') {
        return this.getMockSearchResults(query, options);
      }

      const params = new URLSearchParams({
        q: query,
        page: (options.page || 1).toString(),
        limit: (options.limit || 20).toString(),
        ...(options.category && { category: options.category }),
        ...(options.country && { country: options.country })
      });

      const response = await fetch(`${this.baseURL}/products/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'LAB404-ContentImporter/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Alibaba API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformSearchResponse(data, query);
      
    } catch (error) {
      console.error('Alibaba search failed:', error);
      throw new Error(
        error instanceof Error 
          ? `Search failed: ${error.message}` 
          : 'Failed to search Alibaba products'
      );
    }
  }

  /**
   * Get detailed product content by ID
   */
  async getProductContent(productId: string): Promise<AlibabaProductContent> {
    try {
      await this.checkRateLimit();

      // In demo mode, return mock data
      if (this.apiKey === 'demo-key') {
        return this.getMockProductContent(productId);
      }

      const response = await fetch(`${this.baseURL}/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Product fetch failed: ${response.status}`);
      }

      const data = await response.json();
      return this.transformProductContent(data);
      
    } catch (error) {
      console.error('Product content fetch failed:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to fetch product content'
      );
    }
  }

  /**
   * Transform Alibaba product to local product format (content only)
   */
  transformToLocalProduct(
    alibabaProduct: AlibabaProductContent, 
    options: ContentImportOptions = {}
  ): Omit<Product, 'id' | 'createdAt' | 'updatedAt'> {
    const {
      priceMarkup = 1.3, // Default 30% markup
      targetCategory,
      addTags = [],
      setPriceTo
    } = options;

    // Generate a base price from title/content analysis or use a default
    const estimatedBasePrice = this.estimateBasePrice(alibabaProduct);
    const finalPrice = setPriceTo || (estimatedBasePrice * priceMarkup);

    return {
      name: alibabaProduct.title,
      description: alibabaProduct.description,
      price: Math.round(finalPrice * 100) / 100, // Round to 2 decimals
      compareAtPrice: Math.round(finalPrice * 1.2 * 100) / 100, // 20% higher compare price
      category: targetCategory || alibabaProduct.category,
      brand: alibabaProduct.brand,
      images: alibabaProduct.images,
      videos: alibabaProduct.videos,
      specifications: alibabaProduct.specifications,
      features: alibabaProduct.features,
      tags: [...alibabaProduct.tags, ...addTags, 'imported', 'alibaba'],
      inStock: true, // Default to in stock, admin can adjust
      featured: false, // Default to not featured
      isActive: true,
      requiresShipping: true,
      // Store import metadata without supplier details
      alibabaUrl: `https://alibaba.com/product/${alibabaProduct.id}`,
      importData: {
        alibabaId: alibabaProduct.id,
        importedAt: new Date().toISOString(),
        originalTitle: alibabaProduct.title,
        contentOnly: true // Flag to indicate this is content-only import
      }
    };
  }

  /**
   * Estimate base price from product content (for demo purposes)
   */
  private estimateBasePrice(product: AlibabaProductContent): number {
    // Simple price estimation based on category and title keywords
    const priceIndicators = {
      'phone': 200,
      'laptop': 600,
      'headphones': 80,
      'watch': 150,
      'camera': 300,
      'tablet': 250,
      'speaker': 100,
      'keyboard': 60,
      'mouse': 40,
      'cable': 15,
      'case': 25,
      'charger': 30
    };

    const titleLower = product.title.toLowerCase();
    const categoryLower = product.category.toLowerCase();
    
    // Check for price indicators in title
    for (const [keyword, price] of Object.entries(priceIndicators)) {
      if (titleLower.includes(keyword) || categoryLower.includes(keyword)) {
        return price;
      }
    }

    // Default price based on category
    const categoryDefaults = {
      'smartphones': 200,
      'laptops': 600,
      'accessories': 50,
      'electronics': 100,
      'gaming': 150
    };

    return categoryDefaults[categoryLower as keyof typeof categoryDefaults] || 75;
  }

  /**
   * Rate limiting check
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset counter if interval has passed
    if (now - this.lastResetTime >= RATE_LIMIT.interval) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    // Check if we've exceeded the rate limit
    if (this.requestCount >= RATE_LIMIT.tokensPerInterval) {
      const waitTime = RATE_LIMIT.interval - (now - this.lastResetTime);
      console.warn(`Rate limit reached. Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.lastResetTime = Date.now();
    }

    this.requestCount++;
  }

  /**
   * Transform API search response to our format
   */
  private transformSearchResponse(data: any, query: string): AlibabaSearchResult {
    return {
      products: (data.products || []).map(this.transformProductContent),
      total: data.total || 0,
      page: data.page || 1,
      totalPages: data.totalPages || 1,
      query
    };
  }

  /**
   * Transform individual product content
   */
  private transformProductContent(product: any): AlibabaProductContent {
    return {
      id: product.id || product.productId || `ali_${Date.now()}`,
      title: product.title || product.name || 'Untitled Product',
      description: product.description || product.detail || '',
      images: Array.isArray(product.images) ? product.images : [product.image].filter(Boolean),
      videos: Array.isArray(product.videos) ? product.videos : [],
      category: product.category || 'electronics',
      specifications: this.normalizeSpecifications(product.specifications || product.specs || {}),
      tags: Array.isArray(product.tags) ? product.tags : [],
      brand: product.brand || product.brandName,
      features: Array.isArray(product.features) ? product.features : []
    };
  }

  /**
   * Normalize specifications to consistent format
   */
  private normalizeSpecifications(specs: any): Record<string, string> {
    if (Array.isArray(specs)) {
      // Convert array format [{name, value}] to object
      return specs.reduce((acc, spec) => {
        if (spec.name && spec.value) {
          acc[spec.name] = spec.value.toString();
        }
        return acc;
      }, {});
    }
    
    if (typeof specs === 'object' && specs !== null) {
      // Convert object values to strings
      return Object.entries(specs).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>);
    }

    return {};
  }

  /**
   * Mock data for demo mode
   */
  private getMockSearchResults(query: string, options: any): AlibabaSearchResult {
    const mockProducts: AlibabaProductContent[] = [
      {
        id: 'mock_001',
        title: 'Wireless Bluetooth Earbuds Pro Max',
        description: 'Premium wireless earbuds with active noise cancellation, premium sound quality, and long battery life. Perfect for music, calls, and daily use.',
        images: [
          'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
          'https://images.unsplash.com/photo-1606400082777-ef05f6fd5e9a?w=400',
          'https://images.unsplash.com/photo-1590658165737-15a047b3e1f2?w=400'
        ],
        videos: [],
        category: 'accessories',
        specifications: {
          'Battery Life': '8 hours + 24h case',
          'Connectivity': 'Bluetooth 5.2',
          'Water Resistance': 'IPX7',
          'Driver Size': '10mm Dynamic',
          'Charging': 'USB-C + Wireless',
          'Weight': '4.5g per earbud'
        },
        tags: ['wireless', 'bluetooth', 'audio', 'noise-cancelling'],
        brand: 'AudioTech',
        features: ['Active Noise Cancellation', 'Touch Controls', 'Voice Assistant']
      },
      {
        id: 'mock_002',
        title: 'Gaming Mechanical Keyboard RGB Backlit',
        description: 'Professional gaming keyboard with mechanical switches, customizable RGB backlighting, and premium build quality for competitive gaming.',
        images: [
          'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400',
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400'
        ],
        videos: [],
        category: 'gaming',
        specifications: {
          'Switch Type': 'Blue Mechanical',
          'Backlighting': 'RGB LED',
          'Connection': 'USB-C Wired',
          'Key Layout': '104 Keys Full Size',
          'Polling Rate': '1000Hz',
          'Key Life': '50 million clicks'
        },
        tags: ['gaming', 'keyboard', 'mechanical', 'rgb'],
        brand: 'GameMaster',
        features: ['Hot-Swappable Switches', 'Macro Support', 'Anti-Ghosting']
      },
      {
        id: 'mock_003',
        title: 'Smartphone Ultra Fast Wireless Charger',
        description: 'High-speed wireless charging pad compatible with all Qi-enabled devices. Features overheat protection and premium design.',
        images: [
          'https://images.unsplash.com/photo-1585338447937-d8d1ee442e88?w=400'
        ],
        videos: [],
        category: 'accessories',
        specifications: {
          'Charging Speed': '15W Fast Charging',
          'Compatibility': 'Qi-enabled devices',
          'Input': 'USB-C',
          'Protection': 'Overheat & Overcharge',
          'Size': '100mm diameter',
          'Weight': '120g'
        },
        tags: ['wireless', 'charger', 'fast-charging', 'qi'],
        brand: 'ChargeTech',
        features: ['Fast Charging', 'LED Indicator', 'Non-Slip Design']
      }
    ];

    // Filter by query
    const filtered = query ? mockProducts.filter(p => 
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase()) ||
      p.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    ) : mockProducts;

    return {
      products: filtered,
      total: filtered.length,
      page: options.page || 1,
      totalPages: Math.ceil(filtered.length / (options.limit || 20)),
      query
    };
  }

  /**
   * Get mock product content by ID
   */
  private getMockProductContent(productId: string): AlibabaProductContent {
    const mockResults = this.getMockSearchResults('', {});
    const product = mockResults.products.find(p => p.id === productId);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    return product;
  }
}

// Export a singleton instance
export const alibabaContentAPI = new AlibabaContentAPI();
export default alibabaContentAPI;