import React, { useMemo, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Filter, X, Star } from 'lucide-react';
import { Product } from '@/lib/types';

export interface FilterFacet {
  key: string;
  label: string;
  type: 'checkbox' | 'range' | 'rating' | 'boolean';
  options?: FacetOption[];
  range?: { min: number; max: number; step?: number };
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export interface FacetOption {
  value: string;
  label: string;
  count: number;
  disabled?: boolean;
}

export interface SelectedFilters {
  [key: string]: any;
}

interface FacetedFiltersProps {
  products: Product[];
  facets: FilterFacet[];
  selectedFilters: SelectedFilters;
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
  className?: string;
  showActiveCount?: boolean;
}

// Generate facets from product data
export const generateFacetsFromProducts = (products: Product[]): FilterFacet[] => {
  const facets: FilterFacet[] = [];

  // Category facet
  const categories = new Map<string, number>();
  products.forEach(product => {
    const count = categories.get(product.category) || 0;
    categories.set(product.category, count + 1);
  });

  if (categories.size > 1) {
    facets.push({
      key: 'category',
      label: 'Category',
      type: 'checkbox',
      options: Array.from(categories.entries())
        .map(([value, count]) => ({
          value,
          label: value.charAt(0).toUpperCase() + value.slice(1),
          count
        }))
        .sort((a, b) => b.count - a.count),
      defaultOpen: true
    });
  }

  // Brand facet
  const brands = new Map<string, number>();
  products.forEach(product => {
    if (product.brand) {
      const count = brands.get(product.brand) || 0;
      brands.set(product.brand, count + 1);
    }
  });

  if (brands.size > 1) {
    facets.push({
      key: 'brand',
      label: 'Brand',
      type: 'checkbox',
      options: Array.from(brands.entries())
        .map(([value, count]) => ({
          value,
          label: value,
          count
        }))
        .sort((a, b) => b.count - a.count),
      collapsible: brands.size > 5,
      defaultOpen: brands.size <= 5
    });
  }

  // Price range facet
  const prices = products.map(p => p.price).filter(Boolean);
  if (prices.length > 0) {
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (maxPrice > minPrice) {
      facets.push({
        key: 'priceRange',
        label: 'Price Range',
        type: 'range',
        range: {
          min: Math.floor(minPrice),
          max: Math.ceil(maxPrice),
          step: 10
        },
        defaultOpen: true
      });
    }
  }

  // Rating facet
  const hasRatings = products.some(p => p.rating && p.rating > 0);
  if (hasRatings) {
    facets.push({
      key: 'minRating',
      label: 'Minimum Rating',
      type: 'rating',
      range: { min: 1, max: 5, step: 1 },
      defaultOpen: false
    });
  }

  // Stock status facet
  const hasStockVariation = products.some(p => p.inStock) && products.some(p => !p.inStock);
  if (hasStockVariation) {
    facets.push({
      key: 'inStock',
      label: 'Availability',
      type: 'boolean',
      options: [
        { value: 'true', label: 'In Stock', count: products.filter(p => p.inStock).length },
        { value: 'false', label: 'Out of Stock', count: products.filter(p => !p.inStock).length }
      ],
      defaultOpen: false
    });
  }

  // Featured products facet
  const hasFeatured = products.some(p => p.featured);
  if (hasFeatured) {
    facets.push({
      key: 'featured',
      label: 'Special',
      type: 'boolean',
      options: [
        { value: 'true', label: 'Featured Products', count: products.filter(p => p.featured).length }
      ],
      defaultOpen: false
    });
  }

  // Tags facet (only show most common tags)
  const tags = new Map<string, number>();
  products.forEach(product => {
    product.tags?.forEach(tag => {
      const count = tags.get(tag) || 0;
      tags.set(tag, count + 1);
    });
  });

  const popularTags = Array.from(tags.entries())
    .filter(([, count]) => count > 1) // Only tags that appear multiple times
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Top 10 tags

  if (popularTags.length > 0) {
    facets.push({
      key: 'tags',
      label: 'Tags',
      type: 'checkbox',
      options: popularTags.map(([value, count]) => ({
        value,
        label: value,
        count
      })),
      collapsible: true,
      defaultOpen: false
    });
  }

  return facets;
};

// Individual facet components
const CheckboxFacet: React.FC<{
  facet: FilterFacet;
  selectedValues: string[];
  onChange: (values: string[]) => void;
}> = ({ facet, selectedValues, onChange }) => {
  const handleToggle = useCallback((value: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter(v => v !== value));
    }
  }, [selectedValues, onChange]);

  if (!facet.options) return null;

  return (
    <div className="space-y-2">
      {facet.options.map(option => (
        <label 
          key={option.value} 
          className={`flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded ${
            option.disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Checkbox
            checked={selectedValues.includes(option.value)}
            onCheckedChange={(checked) => handleToggle(option.value, checked as boolean)}
            disabled={option.disabled}
            aria-label={`Filter by ${option.label}`}
          />
          <span className="text-sm flex-grow">{option.label}</span>
          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
            {option.count}
          </Badge>
        </label>
      ))}
    </div>
  );
};

const RangeFacet: React.FC<{
  facet: FilterFacet;
  selectedRange: [number, number];
  onChange: (range: [number, number]) => void;
}> = ({ facet, selectedRange, onChange }) => {
  if (!facet.range) return null;

  const { min, max, step = 1 } = facet.range;

  return (
    <div className="space-y-3">
      <div className="px-2">
        <Slider
          value={selectedRange}
          onValueChange={(value) => onChange(value as [number, number])}
          min={min}
          max={max}
          step={step}
          className="w-full"
          aria-label={`${facet.label} range`}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 px-2">
        <span>${selectedRange[0]}</span>
        <span>${selectedRange[1]}</span>
      </div>
      <div className="flex justify-between text-xs text-gray-400 px-2">
        <span>Min: ${min}</span>
        <span>Max: ${max}</span>
      </div>
    </div>
  );
};

const RatingFacet: React.FC<{
  facet: FilterFacet;
  selectedRating: number;
  onChange: (rating: number) => void;
}> = ({ facet, selectedRating, onChange }) => {
  if (!facet.range) return null;

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map(rating => (
        <label 
          key={rating}
          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
        >
          <Checkbox
            checked={selectedRating === rating}
            onCheckedChange={(checked) => onChange(checked ? rating : 0)}
            aria-label={`${rating} stars and up`}
          />
          <div className="flex items-center space-x-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm">& up</span>
        </label>
      ))}
    </div>
  );
};

const BooleanFacet: React.FC<{
  facet: FilterFacet;
  selectedValues: string[];
  onChange: (values: string[]) => void;
}> = ({ facet, selectedValues, onChange }) => {
  return <CheckboxFacet facet={facet} selectedValues={selectedValues} onChange={onChange} />;
};

// Main component
const FacetedFilters: React.FC<FacetedFiltersProps> = ({
  products,
  facets: providedFacets,
  selectedFilters,
  onFilterChange,
  onClearFilters,
  className = '',
  showActiveCount = true
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Generate facets from products if not provided
  const facets = useMemo(() => {
    if (providedFacets.length > 0) return providedFacets;
    return generateFacetsFromProducts(products);
  }, [products, providedFacets]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.values(selectedFilters).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) return true;
      return value !== undefined && value !== null && value !== '';
    }).length;
  }, [selectedFilters]);

  const toggleSection = useCallback((sectionKey: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionKey)) {
      newCollapsed.delete(sectionKey);
    } else {
      newCollapsed.add(sectionKey);
    }
    setCollapsedSections(newCollapsed);
  }, [collapsedSections]);

  const renderFacet = useCallback((facet: FilterFacet) => {
    const isCollapsed = facet.collapsible && collapsedSections.has(facet.key);
    const shouldBeOpen = facet.defaultOpen !== false;

    const content = (() => {
      switch (facet.type) {
        case 'checkbox':
          return (
            <CheckboxFacet
              facet={facet}
              selectedValues={selectedFilters[facet.key] || []}
              onChange={(values) => onFilterChange(facet.key, values)}
            />
          );
        case 'range':
          const currentRange = selectedFilters[facet.key] || [facet.range!.min, facet.range!.max];
          return (
            <RangeFacet
              facet={facet}
              selectedRange={currentRange}
              onChange={(range) => onFilterChange(facet.key, range)}
            />
          );
        case 'rating':
          return (
            <RatingFacet
              facet={facet}
              selectedRating={selectedFilters[facet.key] || 0}
              onChange={(rating) => onFilterChange(facet.key, rating)}
            />
          );
        case 'boolean':
          return (
            <BooleanFacet
              facet={facet}
              selectedValues={selectedFilters[facet.key] || []}
              onChange={(values) => onFilterChange(facet.key, values)}
            />
          );
        default:
          return null;
      }
    })();

    if (!facet.collapsible || shouldBeOpen) {
      return (
        <div key={facet.key} className="border-b border-gray-200 pb-4 last:border-b-0">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center justify-between">
            {facet.label}
            {facet.collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection(facet.key)}
                className="p-1 h-auto"
                aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${facet.label} section`}
              >
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            )}
          </h3>
          {!isCollapsed && content}
        </div>
      );
    }

    return (
      <Collapsible 
        key={facet.key} 
        open={!isCollapsed}
        onOpenChange={() => toggleSection(facet.key)}
        className="border-b border-gray-200 pb-4 last:border-b-0"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-0 h-auto text-left"
            aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${facet.label} filters`}
          >
            <h3 className="font-medium text-gray-900">{facet.label}</h3>
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          {content}
        </CollapsibleContent>
      </Collapsible>
    );
  }, [selectedFilters, onFilterChange, collapsedSections, toggleSection]);

  if (facets.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {showActiveCount && activeFilterCount > 0 && (
              <Badge variant="default" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="h-8 px-2 lg:px-3"
              aria-label="Clear all filters"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {facets.map(renderFacet)}
      </CardContent>
    </Card>
  );
};

export default FacetedFilters;