import { 
  alibabaContentAPI, 
  AlibabaProductContent, 
  ContentImportOptions, 
  ImportResult, 
  BulkImportResult 
} from './AlibabaContentAPI';
import { Product } from '@/lib/types';
import { productService, CreateProductData } from '@/lib/services/productService';

// Import history tracking
export interface ImportRecord {
  id: string;
  alibabaId: string;
  productId: string;
  productName: string;
  importedAt: string;
  options: ContentImportOptions;
  success: boolean;
  errors?: string[];
}

// Image processing result
export interface ProcessedImage {
  original: string;
  optimized: string;
  width?: number;
  height?: number;
  size?: number;
}

/**
 * Simplified content import manager focused on fast product addition
 * Handles content transformation, image processing, and import tracking
 */
export class ContentImportManager {
  private importHistory: ImportRecord[] = [];
  private maxHistorySize = 500; // Keep last 500 imports

  constructor() {
    this.loadImportHistory();
  }

  /**
   * Import single product with content only
   */
  async importProduct(
    alibabaProduct: AlibabaProductContent,
    options: ContentImportOptions = {}
  ): Promise<ImportResult> {
    const importId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`Starting import for: ${alibabaProduct.title}`);

      // Validate product content
      const validation = this.validateProductContent(alibabaProduct);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          importId
        };
      }

      // Process images (download and optimize)
      const processedImages = await this.processImages(alibabaProduct.images);

      // Transform to local product format
      const localProduct = alibabaContentAPI.transformToLocalProduct(alibabaProduct, options);
      
      // Use processed images
      localProduct.images = processedImages.map(img => img.optimized);

      // Add import metadata
      const productToSave: CreateProductData = {
        ...localProduct,
        importData: {
          ...localProduct.importData,
          importId,
          originalImages: alibabaProduct.images,
          processedImages: processedImages
        }
      };

      // Save to database
      const savedProduct = await productService.createProduct(productToSave);
      
      if (!savedProduct.data) {
        throw new Error(savedProduct.error || 'Failed to save product');
      }

      // Record successful import
      const importRecord: ImportRecord = {
        id: importId,
        alibabaId: alibabaProduct.id,
        productId: savedProduct.data.id,
        productName: alibabaProduct.title,
        importedAt: new Date().toISOString(),
        options,
        success: true
      };

      this.addToHistory(importRecord);

      console.log(`✅ Successfully imported: ${alibabaProduct.title}`);

      return {
        success: true,
        product: savedProduct.data,
        importId
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      console.error(`❌ Import failed for ${alibabaProduct.title}:`, errorMessage);

      // Record failed import
      const importRecord: ImportRecord = {
        id: importId,
        alibabaId: alibabaProduct.id,
        productId: '',
        productName: alibabaProduct.title,
        importedAt: new Date().toISOString(),
        options,
        success: false,
        errors: [errorMessage]
      };

      this.addToHistory(importRecord);

      return {
        success: false,
        errors: [errorMessage],
        importId
      };
    }
  }

  /**
   * Bulk import multiple products
   */
  async bulkImport(
    products: AlibabaProductContent[],
    globalOptions: ContentImportOptions = {},
    batchSize: number = 5,
    delayBetweenBatches: number = 1000
  ): Promise<BulkImportResult> {
    console.log(`🚀 Starting bulk import of ${products.length} products`);
    
    const results: ImportResult[] = [];
    
    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(products.length/batchSize)}`);
      
      // Process batch in parallel
      const batchPromises = batch.map(product => 
        this.importProduct(product, globalOptions)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Collect results
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            errors: [`Batch processing error: ${result.reason}`],
            importId: `failed_${Date.now()}`
          });
        }
      });

      // Add delay between batches (except for last batch)
      if (i + batchSize < products.length) {
        console.log(`⏱️ Waiting ${delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`📊 Bulk import complete: ${successful.length} success, ${failed.length} failed`);

    return {
      successful,
      failed,
      totalProcessed: results.length,
      successCount: successful.length,
      failureCount: failed.length
    };
  }

  /**
   * Process and optimize images
   */
  async processImages(imageUrls: string[]): Promise<ProcessedImage[]> {
    console.log(`🖼️ Processing ${imageUrls.length} images`);
    
    const processed: ProcessedImage[] = [];

    for (const url of imageUrls) {
      try {
        // For now, we'll use the original URLs
        // In production, you might want to:
        // 1. Download images to your CDN/storage
        // 2. Optimize/resize them  
        // 3. Convert formats (WebP, etc.)
        
        const processedImage: ProcessedImage = {
          original: url,
          optimized: url // Using original for now
        };

        // Simulate image processing
        await new Promise(resolve => setTimeout(resolve, 100));

        processed.push(processedImage);
        
      } catch (error) {
        console.warn(`⚠️ Failed to process image: ${url}`, error);
        // Still add the original URL as fallback
        processed.push({
          original: url,
          optimized: url
        });
      }
    }

    return processed;
  }

  /**
   * Validate product content before import
   */
  validateProductContent(product: AlibabaProductContent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!product.title || product.title.trim().length === 0) {
      errors.push('Product title is required');
    }

    if (!product.description || product.description.trim().length === 0) {
      errors.push('Product description is required');
    }

    if (!product.images || product.images.length === 0) {
      errors.push('At least one product image is required');
    }

    if (!product.category || product.category.trim().length === 0) {
      errors.push('Product category is required');
    }

    // Validate title length
    if (product.title && product.title.length > 255) {
      errors.push('Product title is too long (max 255 characters)');
    }

    // Validate description length
    if (product.description && product.description.length > 5000) {
      errors.push('Product description is too long (max 5000 characters)');
    }

    // Validate images
    if (product.images) {
      const invalidImages = product.images.filter(url => !this.isValidImageUrl(url));
      if (invalidImages.length > 0) {
        errors.push(`Invalid image URLs: ${invalidImages.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if URL is a valid image URL
   */
  private isValidImageUrl(url: string): boolean {
    try {
      new URL(url);
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    } catch {
      return false;
    }
  }

  /**
   * Get import history
   */
  getImportHistory(): ImportRecord[] {
    return [...this.importHistory].reverse(); // Most recent first
  }

  /**
   * Get import statistics
   */
  getImportStats() {
    const total = this.importHistory.length;
    const successful = this.importHistory.filter(r => r.success).length;
    const failed = this.importHistory.filter(r => !r.success).length;

    // Recent imports (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentImports = this.importHistory.filter(r => 
      new Date(r.importedAt) > oneDayAgo
    );

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(1) : '0',
      recentImports: recentImports.length,
      lastImportAt: this.importHistory[this.importHistory.length - 1]?.importedAt
    };
  }

  /**
   * Check if product was already imported
   */
  isAlreadyImported(alibabaId: string): ImportRecord | null {
    return this.importHistory.find(r => r.alibabaId === alibabaId && r.success) || null;
  }

  /**
   * Clear import history
   */
  clearHistory(): void {
    this.importHistory = [];
    this.saveImportHistory();
  }

  /**
   * Add import record to history
   */
  private addToHistory(record: ImportRecord): void {
    this.importHistory.push(record);
    
    // Keep only recent imports
    if (this.importHistory.length > this.maxHistorySize) {
      this.importHistory = this.importHistory.slice(-this.maxHistorySize);
    }
    
    this.saveImportHistory();
  }

  /**
   * Save import history to localStorage
   */
  private saveImportHistory(): void {
    try {
      localStorage.setItem('lab404_import_history', JSON.stringify(this.importHistory));
    } catch (error) {
      console.warn('Failed to save import history:', error);
    }
  }

  /**
   * Load import history from localStorage
   */
  private loadImportHistory(): void {
    try {
      const saved = localStorage.getItem('lab404_import_history');
      if (saved) {
        this.importHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load import history:', error);
      this.importHistory = [];
    }
  }
}

// Export singleton instance
export const contentImportManager = new ContentImportManager();
export default contentImportManager;