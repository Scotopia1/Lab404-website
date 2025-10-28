import { useState } from 'react';
import { ChevronDown, ChevronRight, X, Plus, Copy, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Specification {
  id: string;
  name: string;
  value: string;
  group?: string;
}

interface SpecificationsEditorProps {
  specifications: Specification[];
  onChange: (specifications: Specification[]) => void;
  maxSpecs?: number;
  label?: string;
  className?: string;
}

// Common specification names for autocomplete
const COMMON_SPEC_NAMES = {
  power: ['Voltage', 'Current', 'Power', 'Power Consumption', 'Battery Life', 'Charging Time'],
  connectivity: ['Interface', 'Protocol', 'Frequency', 'Data Rate', 'Range', 'Channels'],
  physical: ['Dimensions', 'Weight', 'Material', 'Color', 'IP Rating', 'Operating Temperature'],
  performance: ['Speed', 'Accuracy', 'Resolution', 'Sensitivity', 'Response Time', 'Bandwidth'],
  general: ['Model', 'Brand', 'Warranty', 'Certifications', 'Package Contents', 'Compatibility'],
};

// Specification templates by category
const SPEC_TEMPLATES = {
  arduino: [
    { name: 'Microcontroller', value: 'ATmega328P', group: 'Hardware' },
    { name: 'Operating Voltage', value: '5V', group: 'Power' },
    { name: 'Input Voltage', value: '7-12V', group: 'Power' },
    { name: 'Digital I/O Pins', value: '14', group: 'Hardware' },
    { name: 'Analog Input Pins', value: '6', group: 'Hardware' },
    { name: 'Flash Memory', value: '32 KB', group: 'Memory' },
  ],
  sensor: [
    { name: 'Sensor Type', value: '', group: 'General' },
    { name: 'Measuring Range', value: '', group: 'Performance' },
    { name: 'Accuracy', value: '', group: 'Performance' },
    { name: 'Resolution', value: '', group: 'Performance' },
    { name: 'Interface', value: 'I2C/SPI', group: 'Connectivity' },
    { name: 'Operating Voltage', value: '3.3-5V', group: 'Power' },
  ],
  display: [
    { name: 'Display Type', value: '', group: 'General' },
    { name: 'Screen Size', value: '', group: 'Physical' },
    { name: 'Resolution', value: '', group: 'Performance' },
    { name: 'Touch Screen', value: 'No', group: 'Features' },
    { name: 'Interface', value: 'SPI', group: 'Connectivity' },
    { name: 'Operating Voltage', value: '3.3V', group: 'Power' },
  ],
};

export const SpecificationsEditor = ({
  specifications,
  onChange,
  maxSpecs = 30,
  label = 'Specifications',
  className,
}: SpecificationsEditorProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['General']));
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  // Group specifications
  const groupedSpecs = specifications.reduce((acc, spec) => {
    const group = spec.group || 'General';
    if (!acc[group]) acc[group] = [];
    acc[group].push(spec);
    return acc;
  }, {} as Record<string, Specification[]>);

  const groups = Object.keys(groupedSpecs).sort();

  const addSpecification = (name: string = '', value: string = '', group: string = 'General') => {
    if (specifications.length >= maxSpecs) {
      alert(`Maximum ${maxSpecs} specifications allowed`);
      return;
    }

    const newSpec: Specification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      value: value.trim(),
      group,
    };

    onChange([...specifications, newSpec]);

    // Expand the group if adding to it
    if (group) {
      setExpandedGroups((prev) => new Set(prev).add(group));
    }
  };

  const updateSpecification = (id: string, field: 'name' | 'value' | 'group', newValue: string) => {
    onChange(
      specifications.map((spec) =>
        spec.id === id ? { ...spec, [field]: newValue } : spec
      )
    );
  };

  const removeSpecification = (id: string) => {
    onChange(specifications.filter((spec) => spec.id !== id));
  };

  const duplicateSpecification = (id: string) => {
    const specToDuplicate = specifications.find((s) => s.id === id);
    if (!specToDuplicate || specifications.length >= maxSpecs) return;

    const newSpec: Specification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: specToDuplicate.name,
      value: specToDuplicate.value,
      group: specToDuplicate.group,
    };

    onChange([...specifications, newSpec]);
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to remove all specifications?')) {
      onChange([]);
    }
  };

  const addTemplateSpecs = (template: keyof typeof SPEC_TEMPLATES) => {
    const templateSpecs = SPEC_TEMPLATES[template];
    const availableSlots = maxSpecs - specifications.length;
    const specsToAdd = templateSpecs
      .slice(0, availableSlots)
      .map((spec) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...spec,
      }));

    onChange([...specifications, ...specsToAdd]);

    // Expand all groups from template
    const newGroups = new Set(expandedGroups);
    templateSpecs.forEach((spec) => {
      if (spec.group) newGroups.add(spec.group);
    });
    setExpandedGroups(newGroups);
  };

  // Get all unique groups for the group selector
  const allGroups = [
    'General',
    'Power',
    'Hardware',
    'Memory',
    'Connectivity',
    'Performance',
    'Physical',
    'Features',
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-xs text-gray-500">
          {specifications.length}/{maxSpecs} specifications
        </span>
      </div>

      {/* Specifications List */}
      <div className="space-y-1 border rounded-lg bg-white">
        {groups.length === 0 ? (
          // Empty State
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-3">No specifications added yet</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addSpecification()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Specification
            </Button>
          </div>
        ) : (
          // Grouped Specifications
          groups.map((group) => (
            <div key={group} className="border-b last:border-b-0">
              {/* Group Header */}
              <button
                type="button"
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedGroups.has(group) ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="font-medium text-sm">{group}</span>
                  <span className="text-xs text-gray-500">
                    ({groupedSpecs[group].length})
                  </span>
                </div>
              </button>

              {/* Group Content */}
              {expandedGroups.has(group) && (
                <div className="px-3 pb-3 space-y-2">
                  {groupedSpecs[group].map((spec) => (
                    <div
                      key={spec.id}
                      className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
                    >
                      {/* Spec Name with Autocomplete */}
                      <Popover
                        open={openPopover === spec.id}
                        onOpenChange={(open) => setOpenPopover(open ? spec.id : null)}
                      >
                        <PopoverTrigger asChild>
                          <div className="relative">
                            <Input
                              value={spec.name}
                              onChange={(e) => updateSpecification(spec.id, 'name', e.target.value)}
                              onFocus={() => setOpenPopover(spec.id)}
                              placeholder="Specification name..."
                              className="pr-8"
                            />
                            {spec.name && (
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[200px]" align="start">
                          <Command>
                            <CommandInput placeholder="Search specs..." />
                            <CommandEmpty>No specifications found.</CommandEmpty>
                            {Object.entries(COMMON_SPEC_NAMES).map(([category, names]) => (
                              <CommandGroup key={category} heading={category}>
                                {names.map((name) => (
                                  <CommandItem
                                    key={name}
                                    onSelect={() => {
                                      updateSpecification(spec.id, 'name', name);
                                      setOpenPopover(null);
                                    }}
                                  >
                                    {name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            ))}
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* Spec Value with Actions */}
                      <div className="flex items-center gap-2">
                        <Input
                          value={spec.value}
                          onChange={(e) => updateSpecification(spec.id, 'value', e.target.value)}
                          placeholder="Value..."
                          className="flex-1"
                        />

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
                            <DropdownMenuItem onClick={() => duplicateSpecification(spec.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {/* Move to Group */}
                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                              Move to Group
                            </div>
                            {allGroups.map((groupName) => (
                              <DropdownMenuItem
                                key={groupName}
                                onClick={() => updateSpecification(spec.id, 'group', groupName)}
                                disabled={spec.group === groupName}
                              >
                                {groupName}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => removeSpecification(spec.id)}
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

                  {/* Add Spec to Group */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addSpecification('', '', group)}
                    disabled={specifications.length >= maxSpecs}
                    className="w-full text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add to {group}
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addSpecification()}
          disabled={specifications.length >= maxSpecs}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Specification
        </Button>

        {/* Template Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={specifications.length >= maxSpecs}
            >
              ⚡ Use Template
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => addTemplateSpecs('arduino')}>
              Arduino/Microcontroller
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addTemplateSpecs('sensor')}>
              Sensor Module
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addTemplateSpecs('display')}>
              Display Module
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {specifications.length > 0 && (
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
      <p className="text-xs text-gray-500">
        💡 Organize specifications into groups. Use autocomplete for common spec names.
      </p>
    </div>
  );
};
