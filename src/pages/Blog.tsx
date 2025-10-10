import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Menu, Home, FileText, Calendar, User, Tag, Clock, Eye } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';
import { PageLoadingSkeleton, EmptyState } from '@/components/ui/LoadingStates';
import { useDebouncedCallback } from '@/hooks/usePerformance';
import type { BlogPost, BlogCategory } from '@/api/client';

const Blog = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('published_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Fetch blog posts
  const {
    data: blogData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['blogPosts', {
      search: searchQuery,
      category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      page,
      limit: 12
    }],
    queryFn: () => apiClient.getBlogPosts({
      search: searchQuery || undefined,
      category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
      sort_by: sortBy as any,
      sort_order: sortOrder,
      page,
      limit: 12,
      status: 'published'
    }),
    staleTime: 5 * 60 * 1000
  });

  // Fetch blog categories
  const { data: categoriesData } = useQuery({
    queryKey: ['blogCategories'],
    queryFn: () => apiClient.getBlogCategories({
      is_active: true,
      limit: 50
    }),
    staleTime: 15 * 60 * 1000
  });

  const posts = blogData?.data || [];
  const pagination = blogData?.pagination;
  const categories = categoriesData?.data || [];

  // Handle URL search params
  useEffect(() => {
    const urlSearchQuery = searchParams.get('search');
    const urlCategory = searchParams.get('category');

    if (urlSearchQuery) {
      setSearchQuery(urlSearchQuery);
    }

    if (urlCategory) {
      setSelectedCategory(urlCategory);
    }
  }, [searchParams]);

  // Debounced search
  const debouncedSearch = useDebouncedCallback((query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page on search
  }, 500);

  const handleSearchChange = (value: string) => {
    debouncedSearch(value);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatReadingTime = (minutes: number) => {
    if (minutes < 1) return '< 1 min read';
    return `${minutes} min read`;
  };

  const MenuBar = () => (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
              <Home className="h-4 w-4" />
              <span className="font-medium">Home</span>
            </Link>
            <Link to="/store" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
              <Search className="h-4 w-4" />
              <span className="font-medium">Products</span>
            </Link>
            <Link to="/blog" className="flex items-center space-x-2 text-blue-600 font-medium">
              <FileText className="h-4 w-4" />
              <span>Blog</span>
            </Link>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search blog posts..."
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center space-x-4">
            {/* Category Filter - Desktop */}
            <div className="hidden lg:block">
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Filter - Desktop */}
            <div className="hidden lg:block">
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published_at">Latest</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="view_count">Most Popular</SelectItem>
                  <SelectItem value="reading_time_minutes">Reading Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filters Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Menu & Filters</SheetTitle>
                  <SheetDescription>
                    Navigate and filter blog posts
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Mobile Navigation */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Navigation</h3>
                    <div className="space-y-2">
                      <Link
                        to="/"
                        className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Home className="h-4 w-4" />
                        <span>Home</span>
                      </Link>
                      <Link
                        to="/store"
                        className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Search className="h-4 w-4" />
                        <span>Products</span>
                      </Link>
                      <Link
                        to="/blog"
                        className="flex items-center space-x-2 text-blue-600 font-medium p-2 rounded-lg bg-blue-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <FileText className="h-4 w-4" />
                        <span>Blog</span>
                      </Link>
                    </div>
                  </div>

                  <Separator />

                  {/* Mobile Filters */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Filters</h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sort By
                      </label>
                      <Select value={sortBy} onValueChange={handleSortChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="published_at">Latest</SelectItem>
                          <SelectItem value="title">Title</SelectItem>
                          <SelectItem value="view_count">Most Popular</SelectItem>
                          <SelectItem value="reading_time_minutes">Reading Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );

  const BlogPostCard = ({ post }: { post: BlogPost }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        {post.featured_image && (
          <div className="aspect-video overflow-hidden">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(post.published_at || post.created_at)}</span>
            </div>
            {post.is_featured && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Featured
              </Badge>
            )}
          </div>

          <CardTitle className="text-xl hover:text-blue-600 transition-colors">
            <Link to={`/blog/${post.slug}`} className="line-clamp-2">
              {post.title}
            </Link>
          </CardTitle>

          {post.excerpt && (
            <CardDescription className="line-clamp-3 text-gray-600">
              {post.excerpt}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags?.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              {post.author && (
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={post.author.avatar_url} alt={post.author.full_name} />
                    <AvatarFallback>
                      {post.author.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{post.author.full_name}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {post.reading_time_minutes > 0 && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatReadingTime(post.reading_time_minutes)}</span>
                </div>
              )}

              {post.view_count > 0 && (
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.view_count}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              LAB404 Electronics Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stay updated with the latest in electronics, tutorials, and industry insights
            </p>
          </div>
        </div>
      </div>

      {/* Menu Bar */}
      <MenuBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sort By
                      </label>
                      <Select value={sortBy} onValueChange={handleSortChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="published_at">Latest</SelectItem>
                          <SelectItem value="title">Title</SelectItem>
                          <SelectItem value="view_count">Most Popular</SelectItem>
                          <SelectItem value="reading_time_minutes">Reading Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            {pagination && (
              <>
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} posts
                {selectedCategory !== 'all' && (
                  <span className="ml-2">
                    in <Badge variant="outline" className="border-blue-200 text-blue-600">
                      {categories.find(c => c.id === selectedCategory)?.name}
                    </Badge>
                  </span>
                )}
                {searchQuery && (
                  <span className="ml-2">
                    for "<Badge variant="outline" className="border-blue-200 text-blue-600">{searchQuery}</Badge>"
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Blog Posts Grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <PageLoadingSkeleton />
          ) : error ? (
            <div className="text-center py-12">
              <Alert variant="destructive" className="mb-4 max-w-md mx-auto">
                <AlertDescription className="flex items-center justify-between">
                  Failed to load blog posts
                  <Button variant="ghost" size="sm" onClick={() => refetch()}>
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          ) : posts.length > 0 ? (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
              >
                {posts.map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </motion.div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title="No blog posts found"
              description="Try adjusting your search terms or filters"
              icon={FileText}
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  Clear Filters
                </Button>
              }
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Blog;