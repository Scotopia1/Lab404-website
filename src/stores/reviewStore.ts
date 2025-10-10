import React from 'react';
import { create } from 'zustand';
import { apiClient, type Review, type ReviewSummary } from '@/api/client';

interface ReviewFilters {
  page: number;
  limit: number;
  sort_by: 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating' | 'most_helpful';
  rating_filter?: number;
  verified_only: boolean;
}

interface ReviewState {
  // Reviews data
  reviews: Review[];
  reviewSummary: ReviewSummary | null;
  userReview: Review | null;

  // Pagination
  totalReviews: number;
  currentPage: number;
  totalPages: number;

  // UI state
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Filters
  filters: ReviewFilters;

  // Current product
  currentProductId: string | null;

  // Actions
  setFilters: (filters: Partial<ReviewFilters>) => void;
  loadProductReviews: (productId: string, resetPage?: boolean) => Promise<void>;
  loadReviewSummary: (productId: string) => Promise<void>;
  loadUserReview: (productId: string) => Promise<void>;
  createReview: (productId: string, reviewData: {
    user_name: string;
    rating: number;
    title: string;
    comment: string;
    pros?: string[];
    cons?: string[];
    images?: string[];
  }) => Promise<void>;
  updateReview: (reviewId: string, updateData: {
    rating?: number;
    title?: string;
    comment?: string;
    pros?: string[];
    cons?: string[];
    images?: string[];
  }) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  markReviewHelpful: (reviewId: string, isHelpful: boolean) => Promise<void>;
  clearReviews: () => void;
  clearError: () => void;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  // Initial state
  reviews: [],
  reviewSummary: null,
  userReview: null,
  totalReviews: 0,
  currentPage: 1,
  totalPages: 0,
  isLoading: false,
  isSubmitting: false,
  error: null,
  currentProductId: null,
  filters: {
    page: 1,
    limit: 10,
    sort_by: 'newest',
    verified_only: false,
  },

  // Actions
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  loadProductReviews: async (productId: string, resetPage = false) => {
    const state = get();

    // If switching products, reset everything
    if (state.currentProductId !== productId) {
      set({
        currentProductId: productId,
        reviews: [],
        totalReviews: 0,
        currentPage: 1,
        totalPages: 0,
        filters: { ...state.filters, page: 1 }
      });
    }

    // If resetting page, update filters
    if (resetPage) {
      set((prevState) => ({
        filters: { ...prevState.filters, page: 1 }
      }));
    }

    set({ isLoading: true, error: null });

    try {
      const { filters } = get();
      const result = await apiClient.getProductReviews(productId, filters);

      set({
        reviews: result.reviews,
        totalReviews: result.total,
        currentPage: result.page,
        totalPages: result.totalPages,
        isLoading: false
      });

      console.info(`Loaded ${result.reviews.length} reviews for product ${productId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load reviews';
      console.error('Error loading product reviews:', error);
      set({
        error: errorMessage,
        isLoading: false
      });
    }
  },

  loadReviewSummary: async (productId: string) => {
    try {
      const summary = await apiClient.getReviewSummary(productId);
      set({ reviewSummary: summary });
      console.info(`Loaded review summary for product ${productId}`);
    } catch (error) {
      console.error('Error loading review summary:', error);
      // Don't set error state for summary as it's not critical
    }
  },

  loadUserReview: async (productId: string) => {
    try {
      const userReview = await apiClient.getUserReviewForProduct(productId);
      set({ userReview });
      console.info(`Loaded user review for product ${productId}`);
    } catch (error) {
      // User hasn't reviewed this product yet - this is expected
      set({ userReview: null });
    }
  },

  createReview: async (productId: string, reviewData) => {
    set({ isSubmitting: true, error: null });

    try {
      const newReview = await apiClient.createReview(productId, reviewData);

      // Add the new review to the store
      set((state) => ({
        reviews: [newReview, ...state.reviews],
        userReview: newReview,
        totalReviews: state.totalReviews + 1,
        isSubmitting: false
      }));

      // Reload summary to get updated statistics
      await get().loadReviewSummary(productId);

      console.info(`Created review for product ${productId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create review';
      console.error('Error creating review:', error);
      set({
        error: errorMessage,
        isSubmitting: false
      });
      throw error; // Re-throw for component handling
    }
  },

  updateReview: async (reviewId: string, updateData) => {
    set({ isSubmitting: true, error: null });

    try {
      const updatedReview = await apiClient.updateReview(reviewId, updateData);

      set((state) => ({
        reviews: state.reviews.map(review =>
          review.id === reviewId ? updatedReview : review
        ),
        userReview: state.userReview?.id === reviewId ? updatedReview : state.userReview,
        isSubmitting: false
      }));

      // Reload summary to get updated statistics
      if (get().currentProductId) {
        await get().loadReviewSummary(get().currentProductId!);
      }

      console.info(`Updated review ${reviewId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update review';
      console.error('Error updating review:', error);
      set({
        error: errorMessage,
        isSubmitting: false
      });
      throw error; // Re-throw for component handling
    }
  },

  deleteReview: async (reviewId: string) => {
    set({ isSubmitting: true, error: null });

    try {
      await apiClient.deleteReview(reviewId);

      set((state) => ({
        reviews: state.reviews.filter(review => review.id !== reviewId),
        userReview: state.userReview?.id === reviewId ? null : state.userReview,
        totalReviews: Math.max(0, state.totalReviews - 1),
        isSubmitting: false
      }));

      // Reload summary to get updated statistics
      if (get().currentProductId) {
        await get().loadReviewSummary(get().currentProductId!);
      }

      console.info(`Deleted review ${reviewId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete review';
      console.error('Error deleting review:', error);
      set({
        error: errorMessage,
        isSubmitting: false
      });
      throw error; // Re-throw for component handling
    }
  },

  markReviewHelpful: async (reviewId: string, isHelpful: boolean) => {
    try {
      const result = await apiClient.markReviewHelpful(reviewId, isHelpful);

      // Update the review with new helpful counts
      set((state) => ({
        reviews: state.reviews.map(review =>
          review.id === reviewId ? {
            ...review,
            helpful_count: result.helpful_count,
            not_helpful_count: result.not_helpful_count,
            user_helpful_vote: isHelpful
          } : review
        )
      }));

      console.info(`Marked review ${reviewId} as ${isHelpful ? 'helpful' : 'not helpful'}`);
    } catch (error) {
      console.error('Error marking review helpful:', error);
      // Don't set error state for helpful votes as it's not critical
      throw error; // Re-throw for component handling
    }
  },

  clearReviews: () => {
    set({
      reviews: [],
      reviewSummary: null,
      userReview: null,
      totalReviews: 0,
      currentPage: 1,
      totalPages: 0,
      currentProductId: null,
      error: null
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Helper hook for product-specific reviews
export const useProductReviews = (productId: string) => {
  const store = useReviewStore();

  // Load reviews when productId changes
  React.useEffect(() => {
    if (productId && store.currentProductId !== productId) {
      store.loadProductReviews(productId, true);
      store.loadReviewSummary(productId);
      store.loadUserReview(productId);
    }
  }, [productId, store.currentProductId]);

  return {
    reviews: store.reviews,
    reviewSummary: store.reviewSummary,
    userReview: store.userReview,
    totalReviews: store.totalReviews,
    currentPage: store.currentPage,
    totalPages: store.totalPages,
    isLoading: store.isLoading,
    isSubmitting: store.isSubmitting,
    error: store.error,
    filters: store.filters,
    // Actions
    setFilters: store.setFilters,
    loadMoreReviews: (resetPage?: boolean) => store.loadProductReviews(productId, resetPage),
    createReview: (reviewData: Parameters<typeof store.createReview>[1]) =>
      store.createReview(productId, reviewData),
    updateReview: store.updateReview,
    deleteReview: store.deleteReview,
    markReviewHelpful: store.markReviewHelpful,
    clearError: store.clearError,
  };
};