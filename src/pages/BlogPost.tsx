import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User, Tag, Clock, Eye, Share2, Facebook, Twitter, Linkedin, Copy, Star } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import '@/styles/blog.css';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';
import { PageLoadingSkeleton, EmptyState } from '@/components/ui/LoadingStates';
import type { BlogPost } from '@/api/client';

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Fetch the blog post
  const {
    data: post,
    isLoading,
    error
  } = useQuery({
    queryKey: ['blogPost', slug],
    queryFn: () => {
      if (!slug) throw new Error('No slug provided');
      return apiClient.getBlogPost(slug);
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000
  });

  // Fetch related posts
  const { data: relatedPosts } = useQuery({
    queryKey: ['relatedPosts', post?.id],
    queryFn: () => {
      if (!post?.id) throw new Error('No post ID');
      return apiClient.getRelatedPosts(post.id, 3);
    },
    enabled: !!post?.id,
    staleTime: 15 * 60 * 1000
  });

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

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post ? `${post.title} | LAB404 Electronics Blog` : '';

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle);

    let shareLink = '';

    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
        return;
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
    }
  };

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmptyState
          title="Blog post not found"
          description="The blog post you're looking for doesn't exist or has been removed."
          action={
            <Button onClick={() => navigate('/blog')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{post.meta_title || post.title} | LAB404 Electronics Blog</title>
        <meta name="description" content={post.meta_description || post.excerpt || ''} />
        <meta name="keywords" content={post.meta_keywords?.join(', ') || post.tags?.join(', ') || ''} />

        {/* Open Graph */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || ''} />
        <meta property="og:image" content={post.featured_image || ''} />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="article" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt || ''} />
        <meta name="twitter:image" content={post.featured_image || ''} />

        {/* Canonical URL */}
        {post.canonical_url && <link rel="canonical" href={post.canonical_url} />}

        {/* Article specific */}
        <meta property="article:published_time" content={post.published_at || post.created_at} />
        <meta property="article:modified_time" content={post.updated_at} />
        <meta property="article:author" content={post.author?.full_name || ''} />
        {post.tags?.map((tag, index) => (
          <meta key={index} property="article:tag" content={tag} />
        ))}
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation Bar */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Button
                variant="ghost"
                onClick={() => navigate('/blog')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Blog</span>
              </Button>

              <div className="flex items-center space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleShare('facebook')}>
                      <Facebook className="h-4 w-4 mr-2" />
                      Facebook
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('twitter')}>
                      <Twitter className="h-4 w-4 mr-2" />
                      Twitter
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('linkedin')}>
                      <Linkedin className="h-4 w-4 mr-2" />
                      LinkedIn
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('copy')}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            {/* Category and Featured Badge */}
            <div className="flex items-center space-x-2 mb-4">
              {post.category && (
                <Link
                  to={`/blog?category=${post.category.id}`}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm uppercase tracking-wider transition-colors"
                >
                  {post.category.name}
                </Link>
              )}
              {post.is_featured && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 font-semibold">
                  <Star className="h-3 w-3 mr-1 fill-yellow-600" />
                  Featured
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xl text-gray-600 mb-6 leading-relaxed font-light">
                {post.excerpt}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
              <div className="flex items-center space-x-6">
                {post.author && (
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 ring-2 ring-blue-100">
                      <AvatarImage src={post.author.avatar_url} alt={post.author.full_name} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                        {post.author.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-gray-900">{post.author.full_name}</div>
                      <div className="text-gray-500 text-xs">Author</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-1 text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{formatDate(post.published_at || post.created_at)}</span>
                </div>

                {post.reading_time_minutes > 0 && (
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{formatReadingTime(post.reading_time_minutes)}</span>
                  </div>
                )}

                {post.view_count > 0 && (
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{post.view_count} views</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Featured Image */}
          {post.featured_image && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            </motion.div>
          )}

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="blog-content prose prose-lg max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-8"
            >
              <Separator className="mb-6" />
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-semibold text-gray-700 mr-2 flex items-center">
                  <Tag className="h-4 w-4 mr-1 text-gray-500" />
                  Tags:
                </span>
                {post.tags.map((tag, index) => (
                  <Link
                    key={index}
                    to={`/blog?search=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center"
                  >
                    <Badge 
                      variant="outline" 
                      className="hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-colors border-gray-300 text-gray-700"
                    >
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Related Posts */}
          {relatedPosts && relatedPosts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-12"
            >
              <Separator className="mb-8" />
              <h2 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Card key={relatedPost.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      {relatedPost.featured_image && (
                        <div className="aspect-video mb-3 overflow-hidden rounded-lg">
                          <img
                            src={relatedPost.featured_image}
                            alt={relatedPost.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardTitle className="text-lg">
                        <Link
                          to={`/blog/${relatedPost.slug}`}
                          className="hover:text-blue-600 transition-colors line-clamp-2"
                        >
                          {relatedPost.title}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {relatedPost.excerpt && (
                        <p className="text-gray-600 text-sm line-clamp-3 mb-3 leading-relaxed">
                          {relatedPost.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                        <span>{formatDate(relatedPost.published_at || relatedPost.created_at)}</span>
                        {relatedPost.reading_time_minutes > 0 && (
                          <span>{formatReadingTime(relatedPost.reading_time_minutes)}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </article>
      </div>
    </>
  );
};

export default BlogPostPage;