import React, { useMemo, useCallback, forwardRef, CSSProperties } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Product } from '@/lib/types';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from './ui/LoadingStates';

interface VirtualizedProductGridProps {
  products: Product[];
  loading?: boolean;
  itemsPerRow?: number;
  rowHeight?: number;
  gap?: number;
  onProductSelect?: (product: Product) => void;
  className?: string;
}

interface GridItemProps {
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;
  data: {
    products: Product[];
    itemsPerRow: number;
    gap: number;
    onProductSelect?: (product: Product) => void;
  };
}

// Memoized grid item component for performance
const GridItem = React.memo(({ columnIndex, rowIndex, style, data }: GridItemProps) => {
  const { products, itemsPerRow, gap, onProductSelect } = data;
  const index = rowIndex * itemsPerRow + columnIndex;
  const product = products[index];

  if (!product) {
    return <div style={style} />; // Empty cell
  }

  return (
    <div
      style={{
        ...style,
        left: Number(style.left) + gap,
        top: Number(style.top) + gap,
        width: Number(style.width) - gap,
        height: Number(style.height) - gap,
      }}
    >
      <ProductCard 
        product={product} 
        onSelect={onProductSelect}
      />
    </div>
  );
});

GridItem.displayName = 'GridItem';

// Loading skeleton grid item
const LoadingGridItem = React.memo(({ columnIndex, rowIndex, style, data }: GridItemProps) => {
  const { gap } = data;

  return (
    <div
      style={{
        ...style,
        left: Number(style.left) + gap,
        top: Number(style.top) + gap,
        width: Number(style.width) - gap,
        height: Number(style.height) - gap,
      }}
    >
      <ProductCardSkeleton />
    </div>
  );
});

LoadingGridItem.displayName = 'LoadingGridItem';

// Hook for responsive grid calculations
const useResponsiveGrid = (containerWidth: number, minItemWidth: number = 280, gap: number = 16) => {
  return useMemo(() => {
    const availableWidth = containerWidth - gap;
    const itemsPerRow = Math.max(1, Math.floor((availableWidth + gap) / (minItemWidth + gap)));
    const actualItemWidth = (availableWidth - (itemsPerRow - 1) * gap) / itemsPerRow;
    
    return {
      itemsPerRow,
      itemWidth: actualItemWidth,
    };
  }, [containerWidth, minItemWidth, gap]);
};

export const VirtualizedProductGrid: React.FC<VirtualizedProductGridProps> = ({
  products,
  loading = false,
  itemsPerRow: forcedItemsPerRow,
  rowHeight = 420,
  gap = 16,
  onProductSelect,
  className = ''
}) => {
  const gridData = useMemo(() => ({
    products,
    itemsPerRow: forcedItemsPerRow || 4, // Will be overridden by responsive calculation
    gap,
    onProductSelect
  }), [products, forcedItemsPerRow, gap, onProductSelect]);

  const renderGrid = useCallback((width: number, height: number) => {
    const { itemsPerRow, itemWidth } = useResponsiveGrid(width, 280, gap);
    const rowCount = Math.ceil(products.length / itemsPerRow);
    
    const updatedGridData = {
      ...gridData,
      itemsPerRow
    };

    if (loading) {
      // Show loading skeleton grid
      const skeletonRowCount = Math.ceil(8 / itemsPerRow); // Show 8 skeleton items
      return (
        <Grid
          columnCount={itemsPerRow}
          columnWidth={itemWidth}
          height={height}
          rowCount={skeletonRowCount}
          rowHeight={rowHeight}
          width={width}
          itemData={updatedGridData}
          overscanRowCount={1}
        >
          {LoadingGridItem}
        </Grid>
      );
    }

    if (products.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <div className="text-lg font-semibold mb-2">No products found</div>
            <div className="text-sm">Try adjusting your search or filters</div>
          </div>
        </div>
      );
    }

    return (
      <Grid
        columnCount={itemsPerRow}
        columnWidth={itemWidth}
        height={height}
        rowCount={rowCount}
        rowHeight={rowHeight}
        width={width}
        itemData={updatedGridData}
        overscanRowCount={2} // Render 2 extra rows for smooth scrolling
        overscanColumnCount={1} // Render 1 extra column
      >
        {GridItem}
      </Grid>
    );
  }, [products, loading, rowHeight, gap, gridData]);

  return (
    <div className={`w-full ${className}`} style={{ height: '600px' }}>
      <AutoSizer>
        {({ height, width }) => renderGrid(width, height)}
      </AutoSizer>
    </div>
  );
};

// Infinite scrolling version for very large datasets
interface InfiniteVirtualizedProductGridProps extends Omit<VirtualizedProductGridProps, 'products'> {
  hasNextPage?: boolean;
  isNextPageLoading?: boolean;
  loadNextPage?: () => Promise<void>;
  products: Product[];
  totalCount?: number;
}

export const InfiniteVirtualizedProductGrid: React.FC<InfiniteVirtualizedProductGridProps> = ({
  products,
  hasNextPage = false,
  isNextPageLoading = false,
  loadNextPage,
  totalCount,
  rowHeight = 420,
  gap = 16,
  onProductSelect,
  className = ''
}) => {
  const isItemLoaded = useCallback((index: number) => {
    return !!products[index];
  }, [products]);

  const loadMoreItems = useCallback(async () => {
    if (hasNextPage && loadNextPage && !isNextPageLoading) {
      await loadNextPage();
    }
  }, [hasNextPage, loadNextPage, isNextPageLoading]);

  const renderInfiniteGrid = useCallback((width: number, height: number) => {
    const { itemsPerRow } = useResponsiveGrid(width, 280, gap);
    const itemCount = hasNextPage ? products.length + itemsPerRow : products.length;
    const rowCount = Math.ceil(itemCount / itemsPerRow);

    const gridData = {
      products,
      itemsPerRow,
      gap,
      onProductSelect,
      isNextPageLoading,
      hasNextPage
    };

    return (
      <Grid
        columnCount={itemsPerRow}
        columnWidth={width / itemsPerRow}
        height={height}
        rowCount={rowCount}
        rowHeight={rowHeight}
        width={width}
        itemData={gridData}
        overscanRowCount={3}
        overscanColumnCount={1}
        onScroll={({ scrollTop, scrollHeight, clientHeight }) => {
          // Trigger load more when near bottom
          if (scrollTop + clientHeight >= scrollHeight * 0.8) {
            loadMoreItems();
          }
        }}
      >
        {({ columnIndex, rowIndex, style, data }) => {
          const index = rowIndex * data.itemsPerRow + columnIndex;
          const product = data.products[index];

          if (!product && data.hasNextPage && index >= data.products.length) {
            // Show loading skeleton for items being loaded
            return (
              <div
                style={{
                  ...style,
                  left: Number(style.left) + gap,
                  top: Number(style.top) + gap,
                  width: Number(style.width) - gap,
                  height: Number(style.height) - gap,
                }}
              >
                <ProductCardSkeleton />
              </div>
            );
          }

          if (!product) {
            return <div style={style} />;
          }

          return (
            <div
              style={{
                ...style,
                left: Number(style.left) + gap,
                top: Number(style.top) + gap,
                width: Number(style.width) - gap,
                height: Number(style.height) - gap,
              }}
            >
              <ProductCard 
                product={product} 
                onSelect={data.onProductSelect}
              />
            </div>
          );
        }}
      </Grid>
    );
  }, [products, hasNextPage, isNextPageLoading, rowHeight, gap, onProductSelect, loadMoreItems]);

  return (
    <div className={`w-full ${className}`} style={{ height: '600px' }}>
      <AutoSizer>
        {({ height, width }) => renderInfiniteGrid(width, height)}
      </AutoSizer>
    </div>
  );
};

// Hook for virtual scrolling performance monitoring
export const useVirtualScrollingMetrics = () => {
  const [metrics, setMetrics] = React.useState({
    renderedItems: 0,
    scrollPosition: 0,
    renderTime: 0
  });

  const updateMetrics = useCallback((renderedItems: number, scrollPosition: number) => {
    const startTime = performance.now();
    setMetrics(prev => ({
      ...prev,
      renderedItems,
      scrollPosition,
      renderTime: performance.now() - startTime
    }));
  }, []);

  return { metrics, updateMetrics };
};

export default VirtualizedProductGrid;