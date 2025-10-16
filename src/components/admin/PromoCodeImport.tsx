import React, { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  FileDown,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';
import {
  validateCSV,
  promoCodeValidators,
  readCSVFile,
  downloadCSV,
  CSVValidationResult,
} from '@/lib/csvValidator';

interface PromoCodeImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export const PromoCodeImport: React.FC<PromoCodeImportProps> = ({
  open,
  onOpenChange,
  onImportComplete,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [validationResult, setValidationResult] = useState<CSVValidationResult | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [isDragging, setIsDragging] = useState(false);

  // Download template mutation
  const downloadTemplateMutation = useMutation({
    mutationFn: () => apiClient.downloadPromoTemplate(),
    onSuccess: (blob) => {
      downloadCSV(blob, 'promo-codes-template.csv');
      toast.success('Template downloaded successfully');
    },
    onError: () => toast.error('Failed to download template'),
  });

  // Export promo codes mutation
  const exportMutation = useMutation({
    mutationFn: () => apiClient.exportPromoCodes(),
    onSuccess: (blob) => {
      const timestamp = new Date().toISOString().split('T')[0];
      downloadCSV(blob, `promo-codes-export-${timestamp}.csv`);
      toast.success('Promo codes exported successfully');
    },
    onError: () => toast.error('Failed to export promo codes'),
  });

  // Import promo codes mutation
  const importMutation = useMutation({
    mutationFn: (csvData: string) => apiClient.importPromoCodes(csvData),
    onSuccess: (result) => {
      setImportResult(result);
      setStep('result');
      
      if (result.imported > 0) {
        toast.success(`Successfully imported ${result.imported} promo code(s)`);
      }
      
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} row(s) failed to import`);
      }
      
      if (onImportComplete) {
        onImportComplete();
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to import promo codes');
    },
  });

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    try {
      const content = await readCSVFile(file);
      setCsvContent(content);

      // Validate CSV
      const validation = validateCSV(content, {
        requiredHeaders: ['code', 'discount_type', 'discount_value', 'applies_to'],
        optionalHeaders: ['description', 'product_skus', 'max_uses', 'start_date', 'end_date', 'is_active'],
        maxRows: 10000,
        validators: promoCodeValidators,
      });

      setValidationResult(validation);

      if (validation.valid || validation.errors.length === 0) {
        setStep('preview');
      } else {
        toast.error(`Found ${validation.errors.length} validation error(s)`);
      }
    } catch (error) {
      toast.error('Failed to read CSV file');
    }
  };

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Handle import
  const handleImport = () => {
    if (!csvContent) return;
    importMutation.mutate(csvContent);
  };

  // Reset dialog
  const handleClose = () => {
    setSelectedFile(null);
    setCsvContent('');
    setValidationResult(null);
    setImportResult(null);
    setStep('upload');
    onOpenChange(false);
  };

  // Render upload step
  const renderUploadStep = () => (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-lg font-medium mb-2">
          {isDragging ? 'Drop your CSV file here' : 'Upload CSV file'}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Drag and drop or click to browse
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
          id="csv-upload"
        />
        <label htmlFor="csv-upload">
          <Button type="button" variant="outline" asChild>
            <span>Browse Files</span>
          </Button>
        </label>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          onClick={() => downloadTemplateMutation.mutate()}
          disabled={downloadTemplateMutation.isPending}
          className="flex-1"
        >
          {downloadTemplateMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4 mr-2" />
          )}
          Download Template
        </Button>
        <Button
          variant="outline"
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
          className="flex-1"
        >
          {exportMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export Existing
        </Button>
      </div>

      <Alert>
        <FileText className="h-4 w-4" />
        <AlertTitle>CSV Format</AlertTitle>
        <AlertDescription>
          Required columns: code, discount_type, discount_value, applies_to
          <br />
          Optional: description, product_skus, max_uses, start_date, end_date, is_active
        </AlertDescription>
      </Alert>
    </div>
  );

  // Render preview step
  const renderPreviewStep = () => {
    if (!validationResult) return null;

    const hasErrors = validationResult.errors.length > 0;
    const hasWarnings = validationResult.warnings.length > 0;

    return (
      <div className="space-y-4">
        {/* Validation Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Rows</p>
            <p className="text-2xl font-bold text-blue-600">{validationResult.rowCount}</p>
          </div>
          <div className={`p-4 rounded-lg ${hasErrors ? 'bg-red-50' : 'bg-green-50'}`}>
            <p className="text-sm text-gray-600">Errors</p>
            <p className={`text-2xl font-bold ${hasErrors ? 'text-red-600' : 'text-green-600'}`}>
              {validationResult.errors.length}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${hasWarnings ? 'bg-yellow-50' : 'bg-green-50'}`}>
            <p className="text-sm text-gray-600">Warnings</p>
            <p className={`text-2xl font-bold ${hasWarnings ? 'text-yellow-600' : 'text-green-600'}`}>
              {validationResult.warnings.length}
            </p>
          </div>
        </div>

        {/* Errors */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Validation Errors</AlertTitle>
            <AlertDescription>
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                {validationResult.errors.map((error, idx) => (
                  <div key={idx} className="text-sm">
                    <strong>Row {error.row}</strong>
                    {error.column && <span> ({error.column})</span>}: {error.error}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {hasWarnings && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warnings</AlertTitle>
            <AlertDescription>
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                {validationResult.warnings.map((warning, idx) => (
                  <div key={idx} className="text-sm">
                    <strong>Row {warning.row}</strong>: {warning.error}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Preview Data */}
        {!hasErrors && validationResult.parsedData.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Preview (first 5 rows)</h4>
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-60 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {validationResult.headers.slice(0, 5).map((header) => (
                        <TableHead key={header} className="capitalize">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationResult.parsedData.slice(0, 5).map((row, idx) => (
                      <TableRow key={idx}>
                        {validationResult.headers.slice(0, 5).map((header) => (
                          <TableCell key={header} className="text-sm">
                            {row[header] || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render result step
  const renderResultStep = () => {
    if (!importResult) return null;

    const { total_rows, imported, skipped, errors } = importResult;
    const hasErrors = errors.length > 0;

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Processed</p>
            <p className="text-2xl font-bold text-blue-600">{total_rows}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Imported</p>
            <p className="text-2xl font-bold text-green-600">{imported}</p>
          </div>
          <div className={`p-4 rounded-lg ${hasErrors ? 'bg-red-50' : 'bg-gray-50'}`}>
            <p className="text-sm text-gray-600">Skipped/Errors</p>
            <p className={`text-2xl font-bold ${hasErrors ? 'text-red-600' : 'text-gray-600'}`}>
              {skipped + errors.length}
            </p>
          </div>
        </div>

        {/* Success Message */}
        {imported > 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Import Successful</AlertTitle>
            <AlertDescription>
              Successfully imported {imported} promo code{imported !== 1 ? 's' : ''}.
              {skipped > 0 && ` ${skipped} duplicate code(s) were skipped.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Import Errors */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Import Errors</AlertTitle>
            <AlertDescription>
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                {errors.map((error: any, idx: number) => (
                  <div key={idx} className="text-sm">
                    <strong>Row {error.row}</strong>: {error.error}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && 'Import Promo Codes'}
            {step === 'preview' && 'Preview Import'}
            {step === 'result' && 'Import Results'}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload a CSV file to import promo codes in bulk'}
            {step === 'preview' && 'Review the data before importing'}
            {step === 'result' && 'Import completed'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 'upload' && renderUploadStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'result' && renderResultStep()}
        </div>

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={
                  validationResult?.errors.length !== 0 ||
                  importMutation.isPending
                }
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Promo Codes'
                )}
              </Button>
            </>
          )}
          
          {step === 'result' && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
