/**
 * CSV Validation Utility
 * Provides client-side validation for CSV files before uploading to the server
 */

export interface CSVValidationError {
  row: number;
  column?: string;
  error: string;
  value?: string;
}

export interface CSVValidationResult {
  valid: boolean;
  errors: CSVValidationError[];
  warnings: CSVValidationError[];
  rowCount: number;
  headers: string[];
  parsedData: any[];
}

export interface CSVValidationOptions {
  requiredHeaders: string[];
  optionalHeaders?: string[];
  maxRows?: number;
  maxFileSize?: number; // in bytes
  validators?: Record<string, (value: string, row: number) => string | null>;
}

/**
 * Parse CSV string into structured data
 */
export function parseCSV(csvContent: string): { headers: string[]; rows: any[] } {
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());

  // Parse data rows
  const rows = lines.slice(1).map((line, index) => {
    const values = parseCSVLine(line);
    const row: any = { _rowNumber: index + 2 }; // +2 because index is 0-based and row 1 is headers
    
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });
    
    return row;
  });

  return { headers, rows };
}

/**
 * Parse a single CSV line, handling quotes and commas properly
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current.trim());
  
  return result;
}

/**
 * Validate CSV file content
 */
export function validateCSV(
  csvContent: string,
  options: CSVValidationOptions
): CSVValidationResult {
  const errors: CSVValidationError[] = [];
  const warnings: CSVValidationError[] = [];

  // Parse CSV
  const { headers, rows } = parseCSV(csvContent);

  // Check if file is empty
  if (headers.length === 0) {
    errors.push({
      row: 0,
      error: 'CSV file is empty',
    });
    return {
      valid: false,
      errors,
      warnings,
      rowCount: 0,
      headers: [],
      parsedData: [],
    };
  }

  // Check if there's at least one data row
  if (rows.length === 0) {
    errors.push({
      row: 1,
      error: 'CSV must contain at least one data row',
    });
  }

  // Validate required headers
  const missingHeaders = options.requiredHeaders.filter(
    required => !headers.includes(required.toLowerCase())
  );

  if (missingHeaders.length > 0) {
    errors.push({
      row: 1,
      error: `Missing required headers: ${missingHeaders.join(', ')}`,
    });
  }

  // Check for extra headers
  const allValidHeaders = [
    ...options.requiredHeaders,
    ...(options.optionalHeaders || []),
  ].map(h => h.toLowerCase());

  const extraHeaders = headers.filter(h => !allValidHeaders.includes(h));
  if (extraHeaders.length > 0) {
    warnings.push({
      row: 1,
      error: `Unknown headers will be ignored: ${extraHeaders.join(', ')}`,
    });
  }

  // Check max rows
  if (options.maxRows && rows.length > options.maxRows) {
    errors.push({
      row: 0,
      error: `CSV exceeds maximum allowed rows (${options.maxRows}). Found ${rows.length} rows.`,
    });
  }

  // Validate each row using custom validators
  if (options.validators) {
    rows.forEach((row) => {
      Object.entries(options.validators!).forEach(([column, validator]) => {
        const value = row[column.toLowerCase()];
        const error = validator(value, row._rowNumber);
        
        if (error) {
          errors.push({
            row: row._rowNumber,
            column,
            error,
            value,
          });
        }
      });
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rowCount: rows.length,
    headers,
    parsedData: rows,
  };
}

/**
 * Common validators for promo codes
 */
export const promoCodeValidators = {
  code: (value: string, row: number): string | null => {
    if (!value || !value.trim()) {
      return 'Code is required';
    }
    if (value.length > 50) {
      return 'Code must be 50 characters or less';
    }
    if (!/^[A-Z0-9_-]+$/i.test(value)) {
      return 'Code can only contain letters, numbers, hyphens, and underscores';
    }
    return null;
  },

  discount_type: (value: string, row: number): string | null => {
    if (!value || !value.trim()) {
      return 'Discount type is required';
    }
    const validTypes = ['percentage', 'fixed'];
    if (!validTypes.includes(value.toLowerCase())) {
      return `Discount type must be one of: ${validTypes.join(', ')}`;
    }
    return null;
  },

  discount_value: (value: string, row: number): string | null => {
    if (!value || !value.trim()) {
      return 'Discount value is required';
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      return 'Discount value must be a positive number';
    }
    return null;
  },

  applies_to: (value: string, row: number): string | null => {
    if (!value || !value.trim()) {
      return 'Applies to is required';
    }
    const validTypes = ['order', 'product'];
    if (!validTypes.includes(value.toLowerCase())) {
      return `Applies to must be one of: ${validTypes.join(', ')}`;
    }
    return null;
  },

  max_uses: (value: string, row: number): string | null => {
    if (value && value.trim()) {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 0) {
        return 'Max uses must be a non-negative integer';
      }
    }
    return null;
  },

  start_date: (value: string, row: number): string | null => {
    if (value && value.trim()) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Invalid start date format (use YYYY-MM-DD)';
      }
    }
    return null;
  },

  end_date: (value: string, row: number): string | null => {
    if (value && value.trim()) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Invalid end date format (use YYYY-MM-DD)';
      }
    }
    return null;
  },

  is_active: (value: string, row: number): string | null => {
    if (value && value.trim()) {
      const validValues = ['true', 'false', '1', '0', 'yes', 'no'];
      if (!validValues.includes(value.toLowerCase())) {
        return 'is_active must be true/false, 1/0, or yes/no';
      }
    }
    return null;
  },
};

/**
 * Read CSV file from File object
 */
export function readCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      resolve(content);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Download CSV content as a file
 */
export function downloadCSV(content: string | Blob, filename: string) {
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: 'text/csv;charset=utf-8;' })
    : content;
    
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
