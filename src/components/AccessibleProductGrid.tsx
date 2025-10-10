import React, { useRef, useEffect } from 'react';
import { useKeyboardNavigation, useAccessibleAnnouncement } from '@/hooks/useFocusManagement';
import ProductCard from './ProductCard';
import { Product } from '@/lib/types';

interface AccessibleProductGridProps {
  products: Product[];
  columns?: number;
  onProductSelect?: (product: Product) => void;
  className?: string;
}

export const AccessibleProductGrid: React.FC<AccessibleProductGridProps> = ({
  products,
  columns = 4,
  onProductSelect,
  className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
}) => {
  const { containerRef, setActiveIndex } = useKeyboardNavigation(
    products.length,
    columns,
    onProductSelect ? (index: number) => onProductSelect(products[index]) : undefined
  );
  const { announce } = useAccessibleAnnouncement();

  // Announce when products change
  useEffect(() => {
    if (products.length > 0) {
      announce(`${products.length} products loaded`);
    }
  }, [products.length, announce]);

  return (
    <div
      ref={containerRef}
      className={className}
      role="grid"
      aria-label={`Product grid with ${products.length} items`}
      tabIndex={0}
    >
      {products.map((product, index) => (
        <div
          key={product.id}
          data-keyboard-nav
          tabIndex={-1}
          role="gridcell"
          aria-rowindex={Math.floor(index / columns) + 1}
          aria-colindex={(index % columns) + 1}
          onFocus={() => setActiveIndex(index)}
        >
          <ProductCard 
            product={product}
            onSelect={onProductSelect}
          />
        </div>
      ))}
    </div>
  );
};

export default AccessibleProductGrid;