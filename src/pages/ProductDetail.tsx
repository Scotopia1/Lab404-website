import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Shield, Truck, RefreshCw, Loader2, ShoppingCart, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Header from '@/components/Header';
import WhatsAppButton from '@/components/WhatsAppButton';
import ProductCard from '@/components/ProductCard';
import QuantitySelector from '@/components/ui/quantity-selector';
import ReviewsRatings from '@/components/ReviewsRatings';
import { db } from '@/lib/services/database';
import { useCartActions, useIsInCart, useItemQuantity } from '@/stores/useCartStore';
import { useProductReviews } from '@/stores/reviewStore';
import { toast } from 'sonner';
import type { Product } from '@/lib/types';
import type { Review, ReviewSummary } from '@/api/client';

const ProductDetail = () => {
  const { id } = useParams();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Cart hooks
  const { addItem } = useCartActions();
  const isInCart = useIsInCart(id || '');
  const cartQuantity = useItemQuantity(id || '');

  // Review hooks
  const {
    reviews,
    reviewSummary,
    userReview,
    isLoading: reviewsLoading,
    isSubmitting: reviewSubmitting,
    error: reviewError,
    createReview,
    updateReview,
    deleteReview,
    markReviewHelpful,
    clearError
  } = useProductReviews(id || '');

  useEffect(() => {
    const loadProductDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Load main product
        const productResult = await db.products.getById(id);

        if (productResult.error) {
          setError(productResult.error);
          return;
        }

        if (!productResult.data) {
          setError('Product not found');
          return;
        }

        setProduct(productResult.data);

        // Load related products in the same category
        const relatedResult = await db.products.getAll({
          category: productResult.data.category,
          limit: 5
        });

        if (relatedResult.data) {
          // Filter out current product and limit to 4
          const related = relatedResult.data
            .filter(p => p.id !== id)
            .slice(0, 4);
          setRelatedProducts(related);
        }

      } catch (err) {
        console.error('Error loading product details:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    loadProductDetails();
  }, [id]);

  // Reset selected image index when product changes or when current index is out of bounds
  useEffect(() => {
    if (product) {
      // Reset to first image if current index is out of bounds or when product changes
      if (selectedImageIndex >= product.images.length || selectedImageIndex < 0) {
        setSelectedImageIndex(0);
      }
    }
  }, [product, selectedImageIndex]);

  // Keyboard navigation for image slideshow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!product || product.images.length <= 1) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedImageIndex(prev => {
          const newIndex = prev === 0 ? product.images.length - 1 : prev - 1;
          return Math.max(0, Math.min(newIndex, product.images.length - 1));
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedImageIndex(prev => {
          const newIndex = prev === product.images.length - 1 ? 0 : prev + 1;
          return Math.max(0, Math.min(newIndex, product.images.length - 1));
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product]);

  const handleAddToCart = async () => {
    if (!product) return;

    setIsAddingToCart(true);
    try {
      await addItem(product, quantity);
      toast.success(`${quantity} ${product.name}${quantity > 1 ? 's' : ''} added to cart!`);
    } catch (error) {
      toast.error('Failed to add item to cart');
      console.error('Add to cart error:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handlePreviousImage = () => {
    if (!product || product.images.length <= 1) return;
    setSelectedImageIndex(prev => {
      const newIndex = prev === 0 ? product.images.length - 1 : prev - 1;
      const boundedIndex = Math.max(0, Math.min(newIndex, product.images.length - 1));
      console.log(`Previous: ${prev} -> ${boundedIndex} (images: ${product.images.length})`);
      return boundedIndex;
    });
  };

  const handleNextImage = () => {
    if (!product || product.images.length <= 1) return;
    setSelectedImageIndex(prev => {
      const newIndex = prev === product.images.length - 1 ? 0 : prev + 1;
      const boundedIndex = Math.max(0, Math.min(newIndex, product.images.length - 1));
      console.log(`Next: ${prev} -> ${boundedIndex} (images: ${product.images.length})`);
      return boundedIndex;
    });
  };

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  
  const savings = product?.compareAtPrice ? product.compareAtPrice - product.price : 0;
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-lg text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error === 'Product not found' ? 'Product Not Found' : 'Error Loading Product'}
          </h1>
          <p className="text-gray-600 mb-8">
            {error === 'Product not found' 
              ? "The product you're looking for doesn't exist." 
              : 'There was a problem loading the product details.'
            }
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/store">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Store
              </Button>
            </Link>
            {error !== 'Product not found' && (
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-700">Home</Link>
            <span className="text-gray-400">/</span>
            <Link to="/store" className="text-gray-500 hover:text-gray-700">Store</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm flex items-center justify-center relative group">
              <OptimizedImage
                key={`${product.id}-${selectedImageIndex}`}
                src={product.images[selectedImageIndex]}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover object-center"
                priority={true}
                loading="eager"
                fallbackSrc="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22600%22 viewBox=%220 0 600 600%22%3E%3Crect width=%22600%22 height=%22600%22 fill=%22%23f0f0f0%22/%3E%3Ctext x=%22300%22 y=%22300%22 text-anchor=%22middle%22 dy=%220.3em%22 fill=%22%23999%22 font-family=%22Arial, sans-serif%22 font-size=%2224%22%3EProduct Image%3C/text%3E%3C/svg%3E"
              />

              {/* Navigation Arrows */}
              {product.images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handlePreviousImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Image Counter */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    {selectedImageIndex + 1} / {product.images.length}
                  </div>
                </>
              )}
            </div>
            
            {product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index
                        ? 'border-blue-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <OptimizedImage
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover object-center"
                        fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23f0f0f0'/%3E%3Ctext x='40' y='40' text-anchor='middle' dy='0.3em' fill='%23999' font-family='Arial, sans-serif' font-size='10'%3EThumbnail%3C/text%3E%3C/svg%3E"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div>
              <Badge className="mb-3 bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1 text-sm font-semibold">
                {product.category}
              </Badge>
              <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {product.name}
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Price */}
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-4xl font-bold text-blue-600">
                    {formatPrice(product.price)}
                  </span>
                  {product.compareAtPrice && (
                    <>
                      <span className="text-xl text-gray-400 line-through">
                        {formatPrice(product.compareAtPrice)}
                      </span>
                      <Badge className="bg-red-600 hover:bg-red-700 px-3 py-1">
                        Save {formatPrice(savings)}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>



            {/* Action Buttons */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
              {/* Quantity Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="font-medium text-gray-700 text-base sm:text-lg">Quantity:</span>
                <div className="flex items-center space-x-3">
                  <QuantitySelector
                    value={quantity}
                    onChange={setQuantity}
                    min={1}
                    max={10}
                    disabled={isAddingToCart}
                  />
                  {isInCart && (
                    <span className="text-sm text-gray-500">
                      ({cartQuantity} in cart)
                    </span>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-lg py-3 sm:py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 min-h-[48px] sm:col-span-2"
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Adding to Cart...</span>
                      <span className="sm:hidden">Adding...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span className="hidden sm:inline">Add {quantity > 1 ? `${quantity} ` : ''}to Cart</span>
                      <span className="sm:hidden">Add to Cart</span>
                    </>
                  )}
                </Button>
                
                <WhatsAppButton 
                  product={product} 
                  className="text-base sm:text-lg py-3 sm:py-4 font-semibold shadow-md hover:shadow-lg min-h-[48px] sm:col-span-2"
                />
              </div>
              
              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center space-x-2 text-gray-600 py-2">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-sm font-medium">Warranty Included</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-gray-600 py-2">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium">Fast Shipping</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-gray-600 py-2">
                  <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
                  <span className="text-sm font-medium">Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Features */}
        {product.features && product.features.length > 0 && (
          <div className="mt-16">
            <Card className="bg-gradient-to-r from-blue-50 via-white to-blue-50 border border-blue-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                  <Sparkles className="h-6 w-6 mr-3 text-blue-600" />
                  Key Features
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Product Specifications */}
        <div className="mt-16">
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <Shield className="h-6 w-6 mr-3 text-blue-600" />
                Technical Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(product.specifications || {}).map(([key, value]) => (
                  <div key={key} className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow hover:border-blue-300">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="font-bold text-gray-900 text-base">{key}:</span>
                      <span className="text-gray-700 font-medium bg-gray-50 px-3 py-1 rounded-md">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {Object.keys(product.specifications || {}).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">No specifications available for this product.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <ReviewsRatings
            productId={product.id}
            reviews={reviews}
            summary={reviewSummary}
            userReview={userReview}
            isLoading={reviewsLoading}
            isSubmitting={reviewSubmitting}
            error={reviewError}
            onSubmitReview={async (reviewData) => {
              try {
                await createReview({
                  user_name: reviewData.fullName,
                  rating: reviewData.rating,
                  title: reviewData.title,
                  comment: reviewData.content,
                  pros: reviewData.pros,
                  cons: reviewData.cons,
                  images: reviewData.images || []
                });
                toast.success('Review submitted successfully!');
              } catch (error) {
                console.error('Error submitting review:', error);
                toast.error('Failed to submit review. Please try again.');
              }
            }}
            onUpdateReview={async (reviewId, updateData) => {
              try {
                await updateReview(reviewId, {
                  rating: updateData.rating,
                  title: updateData.title,
                  comment: updateData.content,
                  pros: updateData.pros,
                  cons: updateData.cons,
                  images: updateData.images || []
                });
                toast.success('Review updated successfully!');
              } catch (error) {
                console.error('Error updating review:', error);
                toast.error('Failed to update review. Please try again.');
              }
            }}
            onDeleteReview={async (reviewId) => {
              try {
                await deleteReview(reviewId);
                toast.success('Review deleted successfully!');
              } catch (error) {
                console.error('Error deleting review:', error);
                toast.error('Failed to delete review. Please try again.');
              }
            }}
            onRateHelpful={async (reviewId, helpful) => {
              try {
                await markReviewHelpful(reviewId, helpful);
                toast.success(`Review marked as ${helpful ? 'helpful' : 'not helpful'}`);
              } catch (error) {
                console.error('Error rating review:', error);
                toast.error('Failed to rate review. Please try again.');
              }
            }}
            onClearError={clearError}
            allowReviews={true}
          />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <Card className="bg-gradient-to-r from-blue-50 via-white to-blue-50 border border-blue-200 shadow-lg">
              <CardContent className="p-8 sm:p-12">
                <div className="text-center mb-12">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="w-12 h-0.5 bg-blue-600"></div>
                    <Shield className="h-8 w-8 text-blue-600" />
                    <div className="w-12 h-0.5 bg-blue-600"></div>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Similar Products</h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Discover other high-quality electronics from the same category that might interest you
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                  {relatedProducts.map((relatedProduct) => (
                    <div key={relatedProduct.id} className="transform hover:scale-105 transition-transform duration-200">
                      <ProductCard product={relatedProduct} />
                    </div>
                  ))}
                </div>

                <div className="text-center mt-8">
                  <Link to="/store">
                    <Button
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 px-8 py-3"
                    >
                      View All Products
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
