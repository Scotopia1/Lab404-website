import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
  SortDesc,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import type { Review, ReviewSummary } from '@/api/client';

interface ReviewsRatingsProps {
  productId: string;
  reviews: Review[];
  summary: ReviewSummary | null;
  userReview?: Review | null;
  isLoading?: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  onSubmitReview?: (review: {
    rating: number;
    title: string;
    content: string;
    pros: string[];
    cons: string[];
    verified?: boolean;
    images?: string[];
  }) => void;
  onUpdateReview?: (reviewId: string, updateData: {
    rating?: number;
    title?: string;
    content?: string;
    pros?: string[];
    cons?: string[];
    images?: string[];
  }) => void;
  onDeleteReview?: (reviewId: string) => void;
  onRateHelpful?: (reviewId: string, helpful: boolean) => void;
  onClearError?: () => void;
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
  initialData?: Partial<Review>;
  isSubmitting?: boolean;
  onSubmit: (review: any) => void;
  onCancel: () => void;
}> = ({ productId, initialData, isSubmitting = false, onSubmit, onCancel }) => {
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.comment || '');
  const [pros, setPros] = useState(initialData?.pros?.join('\n') || '');
  const [cons, setCons] = useState(initialData?.cons?.join('\n') || '');
  const [fullName, setFullName] = useState(initialData?.user_name || '');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!title.trim() || !content.trim() || !fullName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    await onSubmit({
      rating,
      title: title.trim(),
      content: content.trim(),
      pros: pros.trim() ? pros.split('\n').map(p => p.trim()).filter(Boolean) : [],
      cons: cons.trim() ? cons.split('\n').map(c => c.trim()).filter(Boolean) : [],
      verified: false,
      images: [],
      fullName: fullName.trim()
    });
  }, [rating, title, content, pros, cons, fullName, onSubmit]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Review' : 'Write a Review'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reviewer-name" className="block text-sm font-medium mb-2">
              Full Name *
            </label>
            <Input
              id="reviewer-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              maxLength={100}
              required
            />
          </div>

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
            <Input
              id="review-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
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
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                initialData ? 'Update Review' : 'Submit Review'
              )}
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
  onUpdate?: (reviewId: string, updateData: any) => void;
  onDelete?: (reviewId: string) => void;
  currentUserId?: string;
  canEdit?: boolean;
}> = ({ review, onRateHelpful, onUpdate, onDelete, currentUserId, canEdit = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleHelpfulClick = useCallback(async (helpful: boolean) => {
    if (onRateHelpful) {
      try {
        await onRateHelpful(review.id, helpful);
      } catch (error) {
        // Error handling is done in the parent component
      }
    }
  }, [review.id, onRateHelpful]);

  const handleEdit = useCallback(async (updateData: any) => {
    if (onUpdate) {
      try {
        await onUpdate(review.id, updateData);
        setIsEditing(false);
      } catch (error) {
        // Error handling is done in the parent component
      }
    }
  }, [review.id, onUpdate]);

  const handleDelete = useCallback(async () => {
    if (onDelete) {
      try {
        await onDelete(review.id);
      } catch (error) {
        // Error handling is done in the parent component
      }
    }
    setShowDeleteConfirm(false);
  }, [review.id, onDelete]);

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isEditing && canEdit) {
    return (
      <ReviewForm
        productId={review.product_id}
        initialData={review}
        onSubmit={handleEdit}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{review.user_name}</span>
                {review.verified_purchase && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified Purchase
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-3 w-3" />
                {formatDate(review.created_at)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <RatingStars rating={review.rating} size="sm" />
            {canEdit && (
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-3">
          <h4 className="font-semibold mb-1">{review.title}</h4>
          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
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
              className={review.user_helpful_vote === true ? 'text-green-600' : ''}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              {review.helpful_count}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleHelpfulClick(false)}
              className={review.user_helpful_vote === false ? 'text-red-600' : ''}
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              {review.not_helpful_count}
            </Button>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Delete Review</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Are you sure you want to delete this review? This action cannot be undone.</p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main reviews and ratings component
export const ReviewsRatings: React.FC<ReviewsRatingsProps> = ({
  productId,
  reviews,
  summary,
  userReview,
  isLoading = false,
  isSubmitting = false,
  error,
  onSubmitReview,
  onUpdateReview,
  onDeleteReview,
  onRateHelpful,
  onClearError,
  currentUserId,
  allowReviews = true,
  className = ''
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | '5' | '4' | '3' | '2' | '1' | 'verified'>('all');

  // Summary data with fallbacks
  const summaryData = useMemo(() => {
    if (!summary || !summary.total_reviews || summary.total_reviews === 0) {
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verified_purchases: 0,
        recommendation_percentage: 0
      };
    }
    return {
      average_rating: summary.average_rating || 0,
      total_reviews: summary.total_reviews || 0,
      rating_distribution: summary.rating_distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      verified_purchases: summary.verified_purchases || 0,
      recommendation_percentage: summary.recommendation_percentage || 0
    };
  }, [summary]);

  // Sort and filter reviews
  const sortedAndFilteredReviews = useMemo(() => {
    let filtered = reviews;

    // Apply filters
    if (filterBy !== 'all') {
      if (filterBy === 'verified') {
        filtered = reviews.filter(review => review.verified_purchase);
      } else {
        const rating = parseInt(filterBy);
        filtered = reviews.filter(review => review.rating === rating);
      }
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        case 'helpful':
          return b.helpful_count - a.helpful_count;
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
      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
              {onClearError && (
                <Button variant="outline" size="sm" onClick={onClearError}>
                  Dismiss
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && (
        <>
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
                      {summaryData.average_rating.toFixed(1)}
                    </span>
                    <div>
                      <RatingStars rating={summaryData.average_rating} size="lg" />
                      <div className="text-sm text-gray-500 mt-1">
                        Based on {summaryData.total_reviews} reviews
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 justify-center lg:justify-start">
                    <TrendingUp className="h-4 w-4" />
                    {summaryData.recommendation_percentage}% recommend this product
                  </div>
                </div>

                {/* Rating Distribution */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(rating => {
                    const count = summaryData.rating_distribution[rating] || 0;
                    const percentage = summaryData.total_reviews > 0 ? (count / summaryData.total_reviews) * 100 : 0;

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

          {/* Review Form Button */}
          {allowReviews && !userReview && !showReviewForm && (
            <div className="mb-6">
              <Button
                onClick={() => setShowReviewForm(true)}
                disabled={isSubmitting}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            </div>
          )}

          {/* User Already Reviewed Message */}
          {userReview && !showReviewForm && (
            <div className="mb-6">
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-blue-600">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span>You have already reviewed this product</span>
                    </div>
                    {allowReviews && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReviewForm(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Review
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Review Form */}
          {showReviewForm && (
            <div className="mb-6">
              <ReviewForm
                productId={productId}
                initialData={userReview || undefined}
                isSubmitting={isSubmitting}
                onSubmit={userReview ?
                  (data) => onUpdateReview?.(userReview.id, data) :
                  handleSubmitReview
                }
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
                  onUpdate={onUpdateReview}
                  onDelete={onDeleteReview}
                  currentUserId={currentUserId}
                  canEdit={review.user_id === currentUserId}
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
                  {allowReviews && !userReview && (
                    <Button
                      onClick={() => setShowReviewForm(true)}
                      disabled={isSubmitting}
                    >
                      Write the First Review
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewsRatings;