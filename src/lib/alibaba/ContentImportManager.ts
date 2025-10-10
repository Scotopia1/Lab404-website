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
      console.log('🚀 [FRONTEND] Starting Alibaba product import process');
      console.log('📋 [FRONTEND] Import Details:', {
        importId,
        title: alibabaProduct.title,
        brand: alibabaProduct.brand,
        price: alibabaProduct.price,
        imageCount: alibabaProduct.images?.length || 0,
        hasDescription: !!alibabaProduct.description,
        category: alibabaProduct.category,
        options: options
      });

      console.log('🔍 [FRONTEND] Raw Alibaba Product Data:', {
        id: alibabaProduct.id,
        title: alibabaProduct.title,
        brand: alibabaProduct.brand,
        price: alibabaProduct.price,
        description: alibabaProduct.description?.substring(0, 200) + '...',
        images: alibabaProduct.images,
        specifications: alibabaProduct.specifications,
        features: alibabaProduct.features,
        tags: alibabaProduct.tags,
        category: alibabaProduct.category
      });

      // Validate product content
      console.log('✅ [FRONTEND] Validating product content...');
      const validation = this.validateProductContent(alibabaProduct);
      if (!validation.valid) {
        console.error('❌ [FRONTEND] Product validation failed:', validation.errors);
        return {
          success: false,
          errors: validation.errors,
          importId
        };
      }
      console.log('✅ [FRONTEND] Product validation passed');

      // Process images (download and optimize)
      console.log('🖼️ [FRONTEND] Processing product images...');
      const processedImages = await this.processImages(alibabaProduct.images);
      console.log('✅ [FRONTEND] Images processed successfully:', {
        originalCount: alibabaProduct.images?.length || 0,
        processedCount: processedImages.length,
        processedUrls: processedImages.map(img => img.optimized)
      });

      // Transform to local product format
      console.log('🔄 [FRONTEND] Transforming to local product format...');
      const localProduct = alibabaContentAPI.transformToLocalProduct(alibabaProduct, options);

      // Use processed images
      localProduct.images = processedImages.map(img => img.optimized);

      console.log('📦 [FRONTEND] Transformed Product Data:', {
        name: localProduct.name,
        price: localProduct.price,
        category: localProduct.category,
        brand: localProduct.brand,
        imageCount: localProduct.images?.length || 0,
        tagCount: localProduct.tags?.length || 0,
        featureCount: localProduct.features?.length || 0,
        hasSpecifications: !!localProduct.specifications
      });

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

      console.log('📝 [FRONTEND] Final product data for API call:', {
        name: productToSave.name,
        price: productToSave.price,
        category: productToSave.category,
        brand: productToSave.brand,
        imageCount: productToSave.images?.length || 0,
        hasImportData: !!productToSave.importData,
        importId: productToSave.importData?.importId
      });

      // Save to database
      console.log('💾 [FRONTEND] Sending product to backend API...');
      const savedProduct = await productService.createProduct(productToSave);

      if (!savedProduct.data) {
        console.error('❌ [FRONTEND] Backend API call failed:', savedProduct.error);
        throw new Error(savedProduct.error || 'Failed to save product');
      }

      console.log('✅ [FRONTEND] Product saved successfully via API:', {
        id: savedProduct.data.id,
        name: savedProduct.data.name,
        sku: savedProduct.data.sku,
        price: savedProduct.data.price,
        slug: savedProduct.data.slug
      });

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

      console.log('🎉 [FRONTEND] Import completed successfully!');
      console.log('📊 [FRONTEND] Import Summary:', {
        importId,
        productId: savedProduct.data.id,
        productName: savedProduct.data.name,
        originalTitle: alibabaProduct.title,
        finalPrice: savedProduct.data.price,
        originalPrice: alibabaProduct.price,
        processedImages: processedImages.length,
        importedAt: importRecord.importedAt
      });

      return {
        success: true,
        product: savedProduct.data,
        importId
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      console.error('❌ [FRONTEND] Product import failed!');
      console.error('💥 [FRONTEND] Error Details:', {
        importId,
        productTitle: alibabaProduct.title,
        productId: alibabaProduct.id,
        errorMessage,
        errorStack: error instanceof Error ? error.stack : null,
        timestamp: new Date().toISOString(),
        alibabaUrl: alibabaProduct.id,
        options
      });

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

      console.error('📝 [FRONTEND] Import failure recorded in history:', {
        recordId: importRecord.id,
        productName: importRecord.productName,
        errorCount: importRecord.errors?.length || 0
      });

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
    console.log('🚀 [FRONTEND] Starting bulk import process');
    console.log('📊 [FRONTEND] Bulk Import Configuration:', {
      totalProducts: products.length,
      batchSize,
      delayBetweenBatches,
      estimatedBatches: Math.ceil(products.length / batchSize),
      globalOptions,
      productsToImport: products.map(p => ({ id: p.id, title: p.title, price: p.price }))
    });

    const results: ImportResult[] = [];
    const startTime = Date.now();

    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const batchNumber = Math.floor(i/batchSize) + 1;
      const totalBatches = Math.ceil(products.length/batchSize);

      console.log(`📦 [FRONTEND] Processing batch ${batchNumber}/${totalBatches}`);
      console.log('🔄 [FRONTEND] Current batch products:', batch.map(p => ({
        id: p.id,
        title: p.title,
        price: p.price
      })));

      // Process batch in parallel
      const batchPromises = batch.map(product =>
        this.importProduct(product, globalOptions)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      // Collect results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          console.log(`✅ [FRONTEND] Batch item ${index + 1} completed:`, {
            success: result.value.success,
            productId: result.value.product?.id,
            productName: result.value.product?.name
          });
        } else {
          const failedResult = {
            success: false,
            errors: [`Batch processing error: ${result.reason}`],
            importId: `failed_${Date.now()}`
          };
          results.push(failedResult);
          console.error(`❌ [FRONTEND] Batch item ${index + 1} failed:`, {
            reason: result.reason,
            productTitle: batch[index]?.title
          });
        }
      });

      const batchSuccessful = results.slice(-batch.length).filter(r => r.success).length;
      console.log(`📊 [FRONTEND] Batch ${batchNumber} complete: ${batchSuccessful}/${batch.length} successful`);

      // Add delay between batches (except for last batch)
      if (i + batchSize < products.length) {
        console.log(`⏱️ [FRONTEND] Waiting ${delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log('🎉 [FRONTEND] Bulk import process completed!');
    console.log('📊 [FRONTEND] Final Bulk Import Results:', {
      totalProcessed: results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: `${((successful.length / results.length) * 100).toFixed(1)}%`,
      totalTimeMs: totalTime,
      averageTimePerProduct: `${(totalTime / results.length).toFixed(0)}ms`,
      successfulProducts: successful.map(s => s.product?.name).filter(Boolean),
      failedProducts: failed.map((f, i) => ({
        index: i + 1,
        errors: f.errors,
        importId: f.importId
      }))
    });

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