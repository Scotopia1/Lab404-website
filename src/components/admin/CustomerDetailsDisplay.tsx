import React, { useEffect, useState } from 'react';
import { Loader2, User, MapPin, Phone } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { customersApi } from '@/api/customers';
import type {
  CustomerWithDetails,
  CustomerName,
  CustomerAddress,
  CustomerPhone,
} from '@/types/customer';
import { getFullName, formatAddress } from '@/types/customer';

interface CustomerDetailsDisplayProps {
  customerId: string;
  selectedNameId: string | null;
  selectedAddressId: string | null;
  selectedPhoneId: string | null;
  onNameChange: (nameId: string | null, name: string) => void;
  onAddressChange: (addressId: string | null, address: string) => void;
  onPhoneChange: (phoneId: string | null, phone: string) => void;
}

const CustomerDetailsDisplay: React.FC<CustomerDetailsDisplayProps> = ({
  customerId,
  selectedNameId,
  selectedAddressId,
  selectedPhoneId,
  onNameChange,
  onAddressChange,
  onPhoneChange,
}) => {
  const [customer, setCustomer] = useState<CustomerWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await customersApi.getCustomerById(customerId);
        setCustomer(data);

        // Auto-select primary variations if not already selected
        if (!selectedNameId && data.primary_name) {
          onNameChange(data.primary_name.id, getFullName(data.primary_name));
        }
        if (!selectedAddressId && data.primary_address) {
          onAddressChange(data.primary_address.id, formatAddress(data.primary_address));
        }
        if (!selectedPhoneId && data.primary_phone) {
          onPhoneChange(data.primary_phone.id, data.primary_phone.phone);
        }
      } catch (err) {
        console.error('Error loading customer details:', err);
        setError('Failed to load customer details');
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [customerId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading customer details...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !customer) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="py-8 text-center text-sm text-red-600">
            {error || 'Customer not found'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleNameChange = (nameId: string) => {
    const name = customer.names.find((n) => n.id === nameId);
    if (name) {
      onNameChange(nameId, getFullName(name));
    }
  };

  const handleAddressChange = (addressId: string) => {
    const address = customer.addresses.find((a) => a.id === addressId);
    if (address) {
      onAddressChange(addressId, formatAddress(address));
    }
  };

  const handlePhoneChange = (phoneId: string) => {
    const phone = customer.phones.find((p) => p.id === phoneId);
    if (phone) {
      onPhoneChange(phoneId, phone.phone);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          <strong>Email:</strong> {customer.email}
          {customer.total_orders > 0 && (
            <span className="ml-2">• {customer.total_orders} previous orders</span>
          )}
        </div>

        {/* Name Selection */}
        {customer.names.length > 0 && (
          <div>
            <Label htmlFor="customer-name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Select Name
            </Label>
            <Select
              value={selectedNameId || undefined}
              onValueChange={handleNameChange}
            >
              <SelectTrigger id="customer-name">
                <SelectValue placeholder="Select a name variation" />
              </SelectTrigger>
              <SelectContent>
                {customer.names.map((name) => (
                  <SelectItem key={name.id} value={name.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{getFullName(name)}</span>
                      {name.is_primary && (
                        <span className="ml-2 text-xs text-blue-600">(Primary)</span>
                      )}
                      {name.used_in_orders > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          Used {name.used_in_orders}x
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Address Selection */}
        {customer.addresses.length > 0 && (
          <div>
            <Label htmlFor="customer-address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Select Address
            </Label>
            <Select
              value={selectedAddressId || undefined}
              onValueChange={handleAddressChange}
            >
              <SelectTrigger id="customer-address">
                <SelectValue placeholder="Select an address" />
              </SelectTrigger>
              <SelectContent>
                {customer.addresses.map((address) => (
                  <SelectItem key={address.id} value={address.id}>
                    <div className="flex flex-col">
                      <span className="text-sm">{formatAddress(address)}</span>
                      <div className="flex items-center gap-2 mt-1">
                        {address.is_primary && (
                          <span className="text-xs text-blue-600">(Primary)</span>
                        )}
                        {address.used_in_orders > 0 && (
                          <span className="text-xs text-muted-foreground">
                            Used {address.used_in_orders}x
                          </span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Phone Selection */}
        {customer.phones.length > 0 && (
          <div>
            <Label htmlFor="customer-phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Select Phone
            </Label>
            <Select
              value={selectedPhoneId || undefined}
              onValueChange={handlePhoneChange}
            >
              <SelectTrigger id="customer-phone">
                <SelectValue placeholder="Select a phone number" />
              </SelectTrigger>
              <SelectContent>
                {customer.phones.map((phone) => (
                  <SelectItem key={phone.id} value={phone.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{phone.phone}</span>
                      {phone.is_primary && (
                        <span className="ml-2 text-xs text-blue-600">(Primary)</span>
                      )}
                      {phone.used_in_orders > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          Used {phone.used_in_orders}x
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {customer.names.length === 0 &&
          customer.addresses.length === 0 &&
          customer.phones.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No customer details available. Please add them manually.
            </div>
          )}
      </CardContent>
    </Card>
  );
};
export default CustomerDetailsDisplay;
