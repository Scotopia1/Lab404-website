import { useState, useRef, KeyboardEvent } from 'react';
import { X, Plus, Tag as TagIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  maxTags?: number;
  placeholder?: string;
  label?: string;
  className?: string;
}

export const TagsInput = ({
  value,
  onChange,
  suggestions = [],
  maxTags = 20,
  placeholder = 'Type and press Enter to add tags...',
  label = 'Tags',
  className,
}: TagsInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input and exclude already added tags
  const filteredSuggestions = suggestions
    .filter(
      (suggestion) =>
        suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
        !value.includes(suggestion)
    )
    .slice(0, 8);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    
    // Validation
    if (!trimmedTag) return;
    if (value.length >= maxTags) {
      alert(`Maximum ${maxTags} tags allowed`);
      return;
    }
    if (value.includes(trimmedTag)) {
      alert('Tag already exists');
      return;
    }
    if (!/^[a-zA-Z0-9-\s]+$/.test(trimmedTag)) {
      alert('Tags can only contain letters, numbers, hyphens, and spaces');
      return;
    }

    onChange([...value, trimmedTag]);
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const clearAll = () => {
    onChange([]);
    inputRef.current?.focus();
  };

  const addPopularTags = () => {
    const popularTags = ['electronics', 'arduino', 'sensors', 'diy', 'iot'];
    const newTags = popularTags.filter((tag) => !value.includes(tag));
    const tagsToAdd = newTags.slice(0, maxTags - value.length);
    onChange([...value, ...tagsToAdd]);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-xs text-gray-500">
          {value.length}/{maxTags} tags
        </span>
      </div>

      {/* Tags Display Area */}
      <div
        className="min-h-[120px] p-3 border rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Tag Badges */}
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 transition-colors px-2.5 py-1 text-sm group"
            >
              <TagIcon className="h-3 w-3 mr-1" />
              {tag}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="ml-1.5 hover:text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                aria-label={`Remove ${tag} tag`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        {/* Input Field */}
        {value.length < maxTags && (
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(inputValue.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={value.length === 0 ? placeholder : 'Add another tag...'}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-8 text-sm"
          />
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Suggested tags:</p>
            <div className="flex flex-wrap gap-2">
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addTag(suggestion)}
                  className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 hover:border-blue-400 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPopularTags}
          disabled={value.length >= maxTags}
          className="text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Popular Tags
        </Button>
        {value.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        Press <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">Enter</kbd> or{' '}
        <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">,</kbd> to add a tag.
        Press <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">Backspace</kbd> to
        remove the last tag.
      </p>
    </div>
  );
};
