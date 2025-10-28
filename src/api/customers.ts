// Customer API client for frontend

import { apiClient } from './client';
import type { CustomerWithDetails, CustomerSearchResult } from '@/types/customer';

export const customersApi = {
  /**
   * Search customers for autocomplete dropdown
   */
  async searchCustomers(query: string, limit: number = 20): Promise<CustomerSearchResult[]> {
    const response = await apiClient.request<{ data: CustomerSearchResult[] }>(
      `/admin/customers/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        method: 'GET',
      }
    );
    return response.data;
  },

  /**
   * Get customer by ID with full details
   */
  async getCustomerById(customerId: string): Promise<CustomerWithDetails> {
    const response = await apiClient.request<{ data: CustomerWithDetails }>(
      `/admin/customers/${customerId}`,
      {
        method: 'GET',
      }
    );
    return response.data;
  },
};
