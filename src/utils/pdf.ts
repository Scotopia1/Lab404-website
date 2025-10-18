import { quotationsApi } from '@/api/quotations';
import type { QuotationWithDetails } from '@/types/quotation';

/**
 * Download PDF for a quotation
 */
export const downloadQuotationPDF = async (quotation: QuotationWithDetails): Promise<void> => {
  try {
    const blob = await quotationsApi.generateQuotationPDF(quotation.id, true);

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotation-${quotation.quotation_number}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download PDF:', error);
    throw new Error('Failed to download PDF');
  }
};

/**
 * Print PDF for a quotation
 */
export const printQuotationPDF = async (quotation: QuotationWithDetails): Promise<void> => {
  try {
    const blob = await quotationsApi.generateQuotationPDF(quotation.id, false);

    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');

    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
          URL.revokeObjectURL(url);
        };
      };
    } else {
      URL.revokeObjectURL(url);
      throw new Error('Failed to open print window');
    }
  } catch (error) {
    console.error('Failed to print PDF:', error);
    throw new Error('Failed to print PDF');
  }
};

/**
 * Open PDF preview in new tab
 */
export const previewQuotationPDF = async (quotation: QuotationWithDetails): Promise<void> => {
  try {
    const blob = await quotationsApi.generateQuotationPDF(quotation.id, false);

    const url = URL.createObjectURL(blob);
    const previewWindow = window.open(url, '_blank');

    if (!previewWindow) {
      URL.revokeObjectURL(url);
      throw new Error('Failed to open preview window');
    }
  } catch (error) {
    console.error('Failed to preview PDF:', error);
    throw new Error('Failed to preview PDF');
  }
};

/**
 * Email PDF to customer
 */
export const emailQuotationPDF = async (
  quotation: QuotationWithDetails,
  email?: string,
  message?: string
): Promise<void> => {
  try {
    const emailAddress = email || quotation.customer_email;
    if (!emailAddress) {
      throw new Error('No email address provided');
    }

    await quotationsApi.emailQuotationPDF(quotation.id, emailAddress, message);
  } catch (error) {
    console.error('Failed to email PDF:', error);
    throw new Error('Failed to email PDF');
  }
};

/**
 * Format PDF filename for quotation
 */
export const getQuotationPDFFilename = (quotation: QuotationWithDetails): string => {
  const cleanNumber = quotation.quotation_number.replace(/[^a-zA-Z0-9-]/g, '');
  return `quotation-${cleanNumber}.pdf`;
};

/**
 * Validate email address
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate PDF blob (for advanced usage)
 */
export const generateQuotationPDFBlob = async (quotation: QuotationWithDetails): Promise<Blob> => {
  try {
    return await quotationsApi.generateQuotationPDF(quotation.id, false);
  } catch (error) {
    console.error('Failed to generate PDF blob:', error);
    throw new Error('Failed to generate PDF');
  }
};