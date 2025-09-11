import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Product Card Skeleton
export const ProductCardSkeleton = () => (
  <Card className="h-full flex flex-col">
    <div className="w-full h-48 sm:h-56 lg:h-48 bg-gray-200 animate-pulse rounded-t-lg" />
    <CardContent className="p-3 sm:p-4 lg:p-5 flex-grow">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3 mb-3" />
      
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-6 w-16" />
      </div>
      
      <div className="flex gap-1 mb-3">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-5 w-16" />
      </div>
    </CardContent>
    
    <CardFooter className="p-3 sm:p-4 lg:p-5 pt-0 mt-auto">
      <div className="w-full space-y-2">
        <Skeleton className="h-10 sm:h-11 w-full" />
        <Skeleton className="h-10 sm:h-11 w-full" />
      </div>
    </CardFooter>
  </Card>
);

// Product Grid Skeleton
export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
    {Array.from({ length: count }, (_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

// Page Loading Skeleton (for lazy-loaded pages)
export const PageLoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50 animate-pulse">
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex space-x-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    </div>
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Skeleton className="h-12 w-64 mb-8" />
      <ProductGridSkeleton />
    </div>
  </div>
);

// Product Detail Skeleton
export const ProductDetailSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Image Section */}
      <div>
        <Skeleton className="w-full h-96 lg:h-[500px] rounded-lg mb-4" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="aspect-square rounded" />
          ))}
        </div>
      </div>
      
      {/* Content Section */}
      <div>
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-2/3 mb-6" />
        
        <div className="flex items-center space-x-4 mb-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
        
        <Skeleton className="h-4 w-16 mb-4" />
        <div className="space-y-2 mb-6">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
        
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  </div>
);

// Search Results Skeleton
export const SearchResultsSkeleton = () => (
  <div>
    <div className="flex justify-between items-center mb-6">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-8 w-32" />
    </div>
    <ProductGridSkeleton />
  </div>
);

// Admin Dashboard Skeleton
export const AdminDashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
);

// Generic Loading Spinner
export const LoadingSpinner = ({ 
  size = 'medium',
  className = '' 
}: { 
  size?: 'small' | 'medium' | 'large';
  className?: string;
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className={`flex justify-center items-center ${className}`} role="status" aria-label="Loading">
      <div 
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`}
        aria-hidden="true"
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Button Loading State
export const ButtonLoading = ({ 
  children, 
  loading = false,
  ...props 
}: { 
  children: React.ReactNode;
  loading?: boolean;
  [key: string]: any;
}) => {
  return (
    <button 
      {...props} 
      disabled={loading || props.disabled}
      className={`${props.className} ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
      aria-busy={loading}
    >
      {loading && (
        <LoadingSpinner size="small" className="mr-2 inline-block" />
      )}
      {children}
    </button>
  );
};

// Empty State Component
export const EmptyState = ({ 
  title,
  description,
  action,
  icon: Icon
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <div className="text-center py-12" role="region" aria-label="No content available">
    {Icon && (
      <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
    )}
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-4 max-w-md mx-auto">{description}</p>
    {action}
  </div>
);