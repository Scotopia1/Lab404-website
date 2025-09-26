import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

const QuantitySelector = ({ 
  value, 
  onChange, 
  min = 1, 
  max = 99, 
  disabled = false,
  className = ""
}: QuantitySelectorProps) => {
  const [inputValue, setInputValue] = useState(value.toString());

  const handleDecrease = () => {
    const newValue = Math.max(min, value - 1);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleIncrease = () => {
    const newValue = Math.min(max, value + 1);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setInputValue(inputVal);

    // Only update parent if it's a valid number within range
    const numValue = parseInt(inputVal);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
    }
  };

  const handleInputBlur = () => {
    // Reset to current value if input is invalid
    const numValue = parseInt(inputValue);
    if (isNaN(numValue) || numValue < min || numValue > max) {
      setInputValue(value.toString());
    }
  };

  return (
    <div className={`flex items-center border border-blue-300 rounded-lg overflow-hidden bg-white ${className}`}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleDecrease}
        disabled={disabled || value <= min}
        className="h-10 w-10 rounded-none border-r border-blue-200 hover:bg-blue-50 text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        disabled={disabled}
        className="w-16 h-10 text-center text-sm font-medium bg-white border-0 focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed text-blue-900"
        aria-label="Quantity"
        min={min}
        max={max}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleIncrease}
        disabled={disabled || value >= max}
        className="h-10 w-10 rounded-none border-l border-blue-200 hover:bg-blue-50 text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default QuantitySelector;