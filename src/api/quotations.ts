// Quotations API client methods
import { apiClient, PaginatedResponse } from './client';
import { QuotationStatus } from '@/types/quotation';
import type {
  Quotation,
  QuotationWithDetails,
  CreateQuotationInput,
  UpdateQuotationInput,
  ChangeQuotationStatusInput,
  QuotationFilters,
  QuotationSummary
} from '@/types/quotation';

export const quotationsApi = {
  // Get all quotations with filtering and pagination
  getQuotations: async (filters?: Partial<QuotationFilters>): Promise<PaginatedResponse<QuotationWithDetails>> => {
    const queryParams: Record<string, any> = {};

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // Handle array values (like multiple statuses)
            queryParams[key] = value.join(',');
          } else if (value instanceof Date) {
            // Format dates as ISO strings
            queryParams[key] = value.toISOString();
          } else {
            queryParams[key] = String(value);
          }
        }
      });
    }

    return apiClient.get('/quotations', queryParams);
  },

  // Get a single quotation by ID
  getQuotation: async (id: string, includeHistory: boolean = false): Promise<QuotationWithDetails> => {
    return apiClient.get(`/quotations/${id}`, { include_history: includeHistory });
  },

  // Create a new quotation
  createQuotation: async (data: CreateQuotationInput): Promise<QuotationWithDetails> => {
    // Convert Date objects to ISO strings for API
    const payload = {
      ...data,
      valid_until: data.valid_until.toISOString(),
    };
    console.log('📤 Final Payload to Backend:', JSON.stringify(payload, null, 2));
    return apiClient.post('/quotations', payload);
  },

  // Update an existing quotation
  updateQuotation: async (id: string, data: UpdateQuotationInput): Promise<QuotationWithDetails> => {
    // Convert Date objects to ISO strings for API
    const payload = {
      ...data,
      ...(data.valid_until && { valid_until: data.valid_until.toISOString() }),
    };
    return apiClient.put(`/quotations/${id}`, payload);
  },

  // Change quotation status
  changeQuotationStatus: async (id: string, data: ChangeQuotationStatusInput): Promise<QuotationWithDetails> => {
    return apiClient.post(`/quotations/${id}/status`, data);
  },

  // Approve a quotation with enhanced options
  approveQuotation: async (
    id: string,
    reason?: string,
    notes?: string,
    sendNotification: boolean = true
  ): Promise<{ quotation: QuotationWithDetails; notificationSent: boolean }> => {
    return apiClient.post(`/quotations/${id}/approve`, {
      reason,
      notes,
      sendNotification
    });
  },

  // Reject a quotation with enhanced options
  rejectQuotation: async (
    id: string,
    reason: string,
    notes?: string,
    sendNotification: boolean = true
  ): Promise<{ quotation: QuotationWithDetails; notificationSent: boolean }> => {
    return apiClient.post(`/quotations/${id}/reject`, {
      reason,
      notes,
      sendNotification
    });
  },

  // Convert quotation to order with enhanced options
  convertToOrder: async (
    id: string,
    options: {
      partialConversion?: boolean;
      itemsToConvert?: string[];
      customerNotes?: string;
      sendConfirmation?: boolean;
    } = {}
  ): Promise<{
    quotation: QuotationWithDetails;
    orderId: string;
    order: any;
    confirmationSent: boolean;
    conversionType: 'partial' | 'full';
  }> => {
    return apiClient.post(`/quotations/${id}/convert`, options);
  },

  // Delete a quotation (drafts only)
  deleteQuotation: async (id: string): Promise<void> => {
    return apiClient.delete(`/quotations/${id}`);
  },

  // Get quotation summary/analytics
  getQuotationSummary: async (): Promise<QuotationSummary> => {
    return apiClient.get('/quotations/summary');
  },

  // Generate PDF for quotation (returns PDF blob)
  generateQuotationPDF: async (id: string, download: boolean = false): Promise<Blob> => {
    const API_BASE_URL = 'http://localhost:3000/api'; // TODO: Use env configuration
    const token = localStorage.getItem('lab404_access_token');

    const response = await fetch(`${API_BASE_URL}/quotations/${id}/pdf?download=${download}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to generate PDF' }));
      throw new Error(errorData.message || 'Failed to generate PDF');
    }

    return response.blob();
  },

  // Email PDF quotation to customer
  emailQuotationPDF: async (id: string, email: string, message?: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post(`/quotations/${id}/email`, { email, message });
  },

  // Mark expired quotations (admin utility)
  markExpiredQuotations: async (): Promise<{ expiredCount: number }> => {
    return apiClient.post('/quotations/mark-expired');
  },

  // Send quotation to customer (changes status to SENT)
  sendQuotation: async (id: string, notes?: string): Promise<QuotationWithDetails> => {
    return apiClient.post(`/quotations/${id}/status`, {
      status: QuotationStatus.SENT,
      notes,
    });
  },

  // Duplicate quotation (create a new draft based on existing quotation)
  duplicateQuotation: async (id: string): Promise<QuotationWithDetails> => {
    const original = await quotationsApi.getQuotation(id);

    // Create new quotation with same data but different valid_until
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

    const duplicateData: CreateQuotationInput = {
      customer_name: original.customer_name,
      customer_email: original.customer_email,
      customer_phone: original.customer_phone || undefined,
      customer_company: original.customer_company || undefined,
      customer_address: original.customer_address || undefined,
      valid_until: futureDate,
      items: original.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage ?? 0,
        discount_amount: item.discount_amount ?? 0,
        sort_order: item.sort_order ?? 0,
      })),
      discount_percentage: original.discount_percentage ?? 0,
      discount_amount: original.discount_amount ?? 0,
      tax_percentage: original.tax_percentage ?? 0,
      shipping_amount: original.shipping_amount ?? 0,
      currency: original.currency || 'USD',
      notes: original.notes || undefined,
      internal_notes: original.internal_notes || undefined,
      terms_and_conditions: original.terms_and_conditions || undefined,
    };

    console.log('🔍 Duplicate Data Before Sending:', JSON.stringify(duplicateData, null, 2));
    return quotationsApi.createQuotation(duplicateData);
  },

  // Get quotations by status
  getQuotationsByStatus: async (status: QuotationStatus, limit: number = 10): Promise<QuotationWithDetails[]> => {
    const response = await quotationsApi.getQuotations({
      status,
      limit,
      sort_by: 'created_at',
      sort_order: 'desc',
    });
    return response.data;
  },

  // Get recent quotations
  getRecentQuotations: async (limit: number = 5): Promise<QuotationWithDetails[]> => {
    const response = await quotationsApi.getQuotations({
      limit,
      sort_by: 'created_at',
      sort_order: 'desc',
    });
    return response.data;
  },

  // Search quotations by customer or quotation number
  searchQuotations: async (query: string, limit: number = 20): Promise<QuotationWithDetails[]> => {
    const response = await quotationsApi.getQuotations({
      search: query,
      limit,
      sort_by: 'created_at',
      sort_order: 'desc',
    });
    return response.data;
  },

  // Get quotations expiring soon
  getExpiringQuotations: async (days: number = 7): Promise<QuotationWithDetails[]> => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const response = await quotationsApi.getQuotations({
      status: [QuotationStatus.SENT, QuotationStatus.APPROVED],
      valid_from: today,
      valid_to: futureDate,
      sort_by: 'valid_until',
      sort_order: 'asc',
    });
    return response.data;
  },

  // Get quotations by date range
  getQuotationsByDateRange: async (
    dateFrom: Date,
    dateTo: Date,
    status?: QuotationStatus
  ): Promise<QuotationWithDetails[]> => {
    const filters: Partial<QuotationFilters> = {
      date_from: dateFrom,
      date_to: dateTo,
      sort_by: 'created_at',
      sort_order: 'desc',
    };

    if (status) {
      filters.status = status;
    }

    const response = await quotationsApi.getQuotations(filters);
    return response.data;
  },

  // Get customer quotations
  getCustomerQuotations: async (customerEmail: string): Promise<QuotationWithDetails[]> => {
    const response = await quotationsApi.getQuotations({
      customer_email: customerEmail,
      sort_by: 'created_at',
      sort_order: 'desc',
    });
    return response.data;
  },

  // Calculate quotation statistics
  calculateQuotationStats: async (dateFrom?: Date, dateTo?: Date) => {
    // Use the dedicated summary endpoint for better performance
    const summary = await quotationsApi.getQuotationSummary();

    return {
      total: summary.total_quotations,
      totalValue: summary.total_value,
      averageValue: summary.average_quotation_value,
      statusCounts: summary.quotations_by_status,
      conversionRate: summary.conversion_rate,
    };
  },
};