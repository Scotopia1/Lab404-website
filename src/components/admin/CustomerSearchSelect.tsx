import React, { useState, useEffect, useCallback } from 'react';
import { Check, ChevronsUpDown, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { customersApi } from '@/api/customers';
import type { CustomerSearchResult } from '@/types/customer';

interface CustomerSearchSelectProps {
  value: string | null;
  onValueChange: (customerId: string | null, customer: CustomerSearchResult | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

const CustomerSearchSelect: React.FC<CustomerSearchSelectProps> = ({
  value,
  onValueChange,
  placeholder = 'Select registered customer...',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<CustomerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);

  // Load top customers when dropdown opens (empty search)
  useEffect(() => {
    if (open && customers.length === 0 && !searchQuery) {
      setSearchQuery(''); // Trigger search with empty query to load top customers
    }
  }, [open]);

  // Debounce search - allow empty query to show top customers
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        const results = await customersApi.searchCustomers(searchQuery, 50);
        // Handle both array response and wrapped response {data: []}
        const customerList = Array.isArray(results) ? results : (results as any)?.data || [];
        setCustomers(customerList);
        console.log('Search results:', customerList.length, 'customers');
      } catch (error) {
        console.error('Error searching customers:', error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelect = useCallback(
    (customer: CustomerSearchResult) => {
      setSelectedCustomer(customer);
      onValueChange(customer.id, customer);
      setOpen(false);
    },
    [onValueChange]
  );

  const handleClear = useCallback(() => {
    setSelectedCustomer(null);
    onValueChange(null, null);
    setSearchQuery('');
    setCustomers([]);
  }, [onValueChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedCustomer ? (
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="truncate">
                {selectedCustomer.name} ({selectedCustomer.email})
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or email..."
            value={searchQuery}
            onValueChange={(value) => setSearchQuery(value || '')}
          />
          <CommandEmpty>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Searching customers...</span>
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {!searchQuery ? 'Start typing to search customers...' : `No customers match "${searchQuery}"`}
              </div>
            )}
          </CommandEmpty>
          {Array.isArray(customers) && customers.length > 0 && (
            <CommandGroup>
              {customers.filter(c => c && c.id && c.name && c.email).map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.id}
                  onSelect={() => handleSelect(customer)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === customer.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {customer.email}
                      {(customer.total_orders || 0) > 0 && ` • ${customer.total_orders} orders`}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </Command>
        {selectedCustomer && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={handleClear}
            >
              Clear Selection
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
export default CustomerSearchSelect;
