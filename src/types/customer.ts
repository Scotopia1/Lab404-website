// Customer TypeScript interfaces for frontend

export interface CustomerName {
  id: string;
  customer_id: string;
  first_name: string;
  last_name: string | null;
  is_primary: boolean;
  used_in_orders: number;
  created_at: Date | string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  address_line_1: string;
  address_line_2: string | null;
  building: string | null;
  floor: string | null;
  city: string;
  region: string | null;
  postal_code: string | null;
  country: string;
  phone: string | null;
  is_primary: boolean;
  used_in_orders: number;
  created_at: Date | string;
}

export interface CustomerPhone {
  id: string;
  customer_id: string;
  phone: string;
  is_primary: boolean;
  used_in_orders: number;
  created_at: Date | string;
}

export interface Customer {
  id: string;
  email: string;
  is_active: boolean;
  notes: string | null;
  total_orders: number;
  total_spent: number;
  quotations_count: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CustomerWithDetails extends Customer {
  names: CustomerName[];
  addresses: CustomerAddress[];
  phones: CustomerPhone[];
  primary_name?: CustomerName;
  primary_address?: CustomerAddress;
  primary_phone?: CustomerPhone;
}

// Customer search result (for autocomplete dropdown)
export interface CustomerSearchResult {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  total_orders: number;
  quotations_count?: number;
}

// Helper functions
export const getFullName = (name: CustomerName): string => {
  return `${name.first_name}${name.last_name ? ' ' + name.last_name : ''}`;
};

export const formatAddress = (address: CustomerAddress): string => {
  const parts: string[] = [];

  if (address.building) parts.push(address.building);
  if (address.floor) parts.push(`Floor ${address.floor}`);
  parts.push(address.address_line_1);
  if (address.address_line_2) parts.push(address.address_line_2);
  parts.push(address.city);
  if (address.region) parts.push(address.region);
  if (address.postal_code) parts.push(address.postal_code);
  parts.push(address.country);

  return parts.join(', ');
};
