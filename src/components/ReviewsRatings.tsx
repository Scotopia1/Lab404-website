import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  TrendingUp,
  Filter,
  SortDesc
} from 'lucide-react';
import { toast } from 'sonner';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  productId: string;
  rating: number;
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  verified: boolean;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt?: string;
  images?: string[];
  userRatedHelpful?: boolean; // Whether current user rated this review helpful
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  verifiedPurchases: number;
  recommendationPercentage: number;
}

interface ReviewsRatingsProps {
  productId: string;
  reviews: Review[];
  summary: ReviewSummary;
  onSubmitReview?: (review: Omit<Review, 'id' | 'userId' | 'userName' | 'createdAt' | 'helpful' | 'notHelpful'>) => void;
  onRateHelpful?: (reviewId: string, helpful: boolean) => void;
  currentUserId?: string;
  allowReviews?: boolean;
  className?: string;
}

// Rating stars component
const RatingStars: React.FC<{
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}> = ({ rating, maxRating = 5, size = 'md', interactive = false, onRatingChange }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const handleClick = (newRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(newRating);
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => {
        const starRating = i + 1;
        const filled = (hoverRating || rating) >= starRating;
        
        return (
          <Star
            key={i}
            className={`${sizeClasses[size]} ${
              filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => handleClick(starRating)}
            onMouseEnter={() => interactive && setHoverRating(starRating)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          />
        );
      })}
    </div>
  );
};

// Review form component
const ReviewForm: React.FC<{
  productId: string;
  onSubmit: (review: any) => void;
  onCancel: () => void;
}> = ({ productId, onSubmit, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        productId,
        rating,
        title: title.trim(),
        content: content.trim(),
        pros: pros.trim() ? pros.split('\n').map(p => p.trim()).filter(Boolean) : [],
        cons: cons.trim() ? cons.split('\n').map(c => c.trim()).filter(Boolean) : [],
        verified: false, // This would be determined by the backend
        images: [] // Image upload would be implemented separately
      });
      
      toast.success('Review submitted successfully!');
      
      // Reset form
      setRating(0);
      setTitle('');
      setContent('');
      setPros('');
      setCons('');
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  }, [rating, title, content, pros, cons, productId, onSubmit]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Rating *
            </label>
            <RatingStars
              rating={rating}
              interactive={true}
              onRatingChange={setRating}
              size="lg"
            />
          </div>

          <div>
            <label htmlFor="review-title" className="block text-sm font-medium mb-2">
              Review Title *
            </label>
            <input
              id="review-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full p-2 border rounded-md"
              maxLength={100}
              required
            />
          </div>

          <div>
            <label htmlFor="review-content" className="block text-sm font-medium mb-2">
              Review Content *
            </label>
            <Textarea
              id="review-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your detailed experience with this product"
              className="min-h-[120px]"
              maxLength={1000}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="review-pros" className="block text-sm font-medium mb-2">
                Pros (one per line)
              </label>
              <Textarea
                id="review-pros"
                value={pros}
                onChange={(e) => setPros(e.target.value)}
                placeholder="What did you like about this product?"
                className="min-h-[80px]"
              />
            </div>

            <div>
              <label htmlFor="review-cons" className="block text-sm font-medium mb-2">
                Cons (one per line)
              </label>
              <Textarea
                id="review-cons"
                value={cons}
                onChange={(e) => setCons(e.target.value)}
                placeholder="What could be improved?"
                className="min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Individual review component
const ReviewCard: React.FC<{
  review: Review;
  onRateHelpful?: (reviewId: string, helpful: boolean) => void;
  currentUserId?: string;
}> = ({ review, onRateHelpful, currentUserId }) => {
  const handleHelpfulClick = useCallback((helpful: boolean) => {
    if (onRateHelpful) {
      onRateHelpful(review.id, helpful);
    }
  }, [review.id, onRateHelpful]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={review.userAvatar} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{review.userName}</span>
                {review.verified && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified Purchase
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-3 w-3" />
                {formatDate(review.createdAt)}
              </div>
            </div>
          </div>
          <RatingStars rating={review.rating} size="sm" />
        </div>

        <div className="mb-3">
          <h4 className="font-semibold mb-1">{review.title}</h4>
          <p className="text-gray-700 leading-relaxed">{review.content}</p>
        </div>

        {(review.pros.length > 0 || review.cons.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {review.pros.length > 0 && (
              <div>
                <h5 className="font-medium text-green-700 mb-2 flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  Pros
                </h5>
                <ul className="space-y-1 text-sm">
                  {review.pros.map((pro, index) => (
                    <li key={index} className="text-green-700">• {pro}</li>
                  ))}
                </ul>
              </div>
            )}

            {review.cons.length > 0 && (
              <div>
                <h5 className="font-medium text-red-700 mb-2 flex items-center gap-1">
                  <ThumbsDown className="h-4 w-4" />
                  Cons
                </h5>
                <ul className="space-y-1 text-sm">
                  {review.cons.map((con, index) => (
                    <li key={index} className="text-red-700">• {con}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <Separator className="my-3" />

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Was this review helpful?
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleHelpfulClick(true)}
              className={review.userRatedHelpful === true ? 'text-green-600' : ''}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              {review.helpful}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleHelpfulClick(false)}
              className={review.userRatedHelpful === false ? 'text-red-600' : ''}
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              {review.notHelpful}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main reviews and ratings component
export const ReviewsRatings: React.FC<ReviewsRatingsProps> = ({
  productId,
  reviews,
  summary,
  onSubmitReview,
  onRateHelpful,
  currentUserId,
  allowReviews = true,
  className = ''
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | '5' | '4' | '3' | '2' | '1' | 'verified'>('all');

  // Sort and filter reviews
  const sortedAndFilteredReviews = useMemo(() => {
    let filtered = reviews;

    // Apply filters
    if (filterBy !== 'all') {
      if (filterBy === 'verified') {
        filtered = reviews.filter(review => review.verified);
      } else {
        const rating = parseInt(filterBy);
        filtered = reviews.filter(review => review.rating === rating);
      }
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        case 'helpful':
          return b.helpful - a.helpful;
        default:
          return 0;
      }
    });

    return sorted;
  }, [reviews, sortBy, filterBy]);

  const handleSubmitReview = useCallback(async (reviewData: any) => {
    if (onSubmitReview) {
      await onSubmitReview(reviewData);
      setShowReviewForm(false);
    }
  }, [onSubmitReview]);

  return (
    <div className={className}>
      {/* Summary Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Customer Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="text-center lg:text-left">
              <div className="flex items-center gap-2 mb-2 justify-center lg:justify-start">
                <span className="text-4xl font-bold">
                  {summary.averageRating.toFixed(1)}
                </span>
                <div>
                  <RatingStars rating={summary.averageRating} size="lg" />
                  <div className="text-sm text-gray-500 mt-1">
                    Based on {summary.totalReviews} reviews
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 justify-center lg:justify-start">
                <TrendingUp className="h-4 w-4" />
                {summary.recommendationPercentage}% recommend this product
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = summary.ratingDistribution[rating] || 0;
                const percentage = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-6">{rating}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <Progress value={percentage} className="flex-1" />
                    <span className="text-sm text-gray-500 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      {allowReviews && !showReviewForm && (
        <div className="mb-6">
          <Button onClick={() => setShowReviewForm(true)}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Write a Review
          </Button>
        </div>
      )}

      {showReviewForm && (
        <div className="mb-6">
          <ReviewForm
            productId={productId}
            onSubmit={handleSubmitReview}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {/* Filters and Sorting */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter reviews" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <SortDesc className="h-4 w-4" />
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest">Highest Rated</SelectItem>
                <SelectItem value="lowest">Lowest Rated</SelectItem>
                <SelectItem value="helpful">Most Helpful</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {sortedAndFilteredReviews.length > 0 ? (
          sortedAndFilteredReviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              onRateHelpful={onRateHelpful}
              currentUserId={currentUserId}
            />
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
              <p className="text-gray-500 mb-4">
                Be the first to review this product and help other customers make informed decisions.
              </p>
              {allowReviews && (
                <Button onClick={() => setShowReviewForm(true)}>
                  Write the First Review
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReviewsRatings;