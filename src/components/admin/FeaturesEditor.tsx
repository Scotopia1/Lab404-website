import { useState } from 'react';
import { GripVertical, X, Plus, Star, Copy, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Feature {
  id: string;
  value: string;
  isKey?: boolean;
}

interface FeaturesEditorProps {
  features: Feature[];
  onChange: (features: Feature[]) => void;
  maxFeatures?: number;
  label?: string;
  className?: string;
}

const FEATURE_TEMPLATES = {
  basic: [
    'Easy to use',
    'High quality materials',
    'Compact design',
    'Lightweight',
    'Durable construction',
  ],
  technical: [
    'Low power consumption',
    'High precision sensor',
    'Fast response time',
    'Wide operating range',
    'Built-in protection',
  ],
  connectivity: [
    'USB connectivity',
    'Wireless communication',
    'I2C/SPI interface',
    'UART support',
    'GPIO expansion',
  ],
};

export const FeaturesEditor = ({
  features,
  onChange,
  maxFeatures = 20,
  label = 'Product Features',
  className,
}: FeaturesEditorProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addFeature = (value: string = '') => {
    if (features.length >= maxFeatures) {
      alert(`Maximum ${maxFeatures} features allowed`);
      return;
    }

    const newFeature: Feature = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      value: value.trim(),
      isKey: false,
    };

    onChange([...features, newFeature]);
  };

  const updateFeature = (id: string, value: string) => {
    onChange(
      features.map((feature) =>
        feature.id === id ? { ...feature, value } : feature
      )
    );
  };

  const removeFeature = (id: string) => {
    onChange(features.filter((feature) => feature.id !== id));
  };

  const toggleKeyFeature = (id: string) => {
    onChange(
      features.map((feature) =>
        feature.id === id ? { ...feature, isKey: !feature.isKey } : feature
      )
    );
  };

  const duplicateFeature = (id: string) => {
    const featureToDuplicate = features.find((f) => f.id === id);
    if (!featureToDuplicate || features.length >= maxFeatures) return;

    const newFeature: Feature = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      value: featureToDuplicate.value,
      isKey: false,
    };

    const index = features.findIndex((f) => f.id === id);
    const newFeatures = [...features];
    newFeatures.splice(index + 1, 0, newFeature);
    onChange(newFeatures);
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to remove all features?')) {
      onChange([]);
    }
  };

  const addTemplateFeatures = (template: keyof typeof FEATURE_TEMPLATES) => {
    const templateFeatures = FEATURE_TEMPLATES[template];
    const availableSlots = maxFeatures - features.length;
    const featuresToAdd = templateFeatures
      .slice(0, availableSlots)
      .map((value) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        value,
        isKey: false,
      }));

    onChange([...features, ...featuresToAdd]);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFeatures = [...features];
    const draggedFeature = newFeatures[draggedIndex];
    newFeatures.splice(draggedIndex, 1);
    newFeatures.splice(index, 0, draggedFeature);

    onChange(newFeatures);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-xs text-gray-500">
          {features.length}/{maxFeatures} features
        </span>
      </div>

      {/* Features List */}
      <div className="space-y-2">
        {features.map((feature, index) => (
          <div
            key={feature.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              'group flex items-start gap-2 p-3 bg-white border rounded-lg hover:border-blue-300 transition-all',
              feature.isKey && 'bg-yellow-50 border-yellow-300',
              draggedIndex === index && 'opacity-50'
            )}
          >
            {/* Drag Handle */}
            <button
              type="button"
              className="mt-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-5 w-5" />
            </button>

            {/* Feature Number */}
            <span className="mt-2 text-sm font-medium text-gray-500 min-w-[24px]">
              {index + 1}.
            </span>

            {/* Feature Input */}
            <div className="flex-1">
              <Textarea
                value={feature.value}
                onChange={(e) => updateFeature(feature.id, e.target.value)}
                placeholder="Enter product feature..."
                className="min-h-[60px] resize-none"
                rows={2}
              />
              {feature.value.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {feature.value.length} characters
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-start gap-1 mt-1">
              {/* Key Feature Toggle */}
              <button
                type="button"
                onClick={() => toggleKeyFeature(feature.id)}
                className={cn(
                  'p-1.5 rounded hover:bg-gray-100 transition-colors',
                  feature.isKey
                    ? 'text-yellow-600 hover:bg-yellow-100'
                    : 'text-gray-400 hover:text-yellow-600'
                )}
                aria-label={feature.isKey ? 'Remove from key features' : 'Mark as key feature'}
                title={feature.isKey ? 'Key Feature' : 'Mark as Key Feature'}
              >
                <Star className={cn('h-4 w-4', feature.isKey && 'fill-current')} />
              </button>

              {/* More Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="sr-only">More actions</span>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => duplicateFeature(feature.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => removeFeature(feature.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {features.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50">
            <p className="text-sm text-gray-500 mb-3">No features added yet</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addFeature()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Feature
            </Button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addFeature()}
          disabled={features.length >= maxFeatures}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Feature
        </Button>

        {/* Template Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={features.length >= maxFeatures}
            >
              ⚡ Use Template
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => addTemplateFeatures('basic')}>
              Basic Features
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addTemplateFeatures('technical')}>
              Technical Features
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addTemplateFeatures('connectivity')}>
              Connectivity Features
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {features.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Help Text */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500">
          💡 Drag features to reorder. Click the star icon to mark key features.
        </p>
        {features.filter((f) => f.isKey).length > 0 && (
          <p className="text-xs text-yellow-700 flex items-center gap-1">
            <Star className="h-3 w-3 fill-current" />
            {features.filter((f) => f.isKey).length} key feature(s) highlighted
          </p>
        )}
      </div>
    </div>
  );
};
