import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Download,
  Printer,
  Mail,
  Eye,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { quotationsApi } from '@/api/quotations';
import type { QuotationWithDetails } from '@/types/quotation';

interface QuotationPDFPreviewProps {
  quotation: QuotationWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onEmailSent?: () => void;
}

const QuotationPDFPreview: React.FC<QuotationPDFPreviewProps> = ({
  quotation,
  isOpen,
  onClose,
  onEmailSent,
}) => {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailData, setEmailData] = useState({
    email: '',
    message: ''
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate PDF when dialog opens and quotation is available
  React.useEffect(() => {
    if (isOpen && quotation && !pdfBlob) {
      generatePDF();
    }
  }, [isOpen, quotation]);

  // Set default email when quotation changes
  React.useEffect(() => {
    if (quotation) {
      setEmailData(prev => ({
        ...prev,
        email: quotation.customer_email || prev.email
      }));
    }
  }, [quotation]);

  // Clean up object URL when component unmounts or dialog closes
  React.useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const generatePDF = async () => {
    if (!quotation) return;

    setLoading(true);
    setError(null);

    try {
      const blob = await quotationsApi.generateQuotationPDF(quotation.id, false);
      setPdfBlob(blob);

      // Create object URL for iframe
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfBlob || !quotation) return;

    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotation-${quotation.quotation_number}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.print();
      } catch (err) {
        console.error('Print failed:', err);
        // Fallback: open in new window and print
        if (pdfUrl) {
          const printWindow = window.open(pdfUrl, '_blank');
          if (printWindow) {
            printWindow.onload = () => {
              printWindow.print();
            };
          }
        }
      }
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotation || !emailData.email.trim()) return;

    setEmailLoading(true);
    setEmailError(null);
    setEmailSuccess(false);

    try {
      await quotationsApi.emailQuotationPDF(
        quotation.id,
        emailData.email.trim(),
        emailData.message.trim() || undefined
      );
      setEmailSuccess(true);
      setShowEmailForm(false);

      // Reset form
      setTimeout(() => {
        setEmailData(prev => ({ ...prev, message: '' }));
        setEmailSuccess(false);
      }, 3000);

      if (onEmailSent) {
        onEmailSent();
      }
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleClose = () => {
    setPdfBlob(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setError(null);
    setShowEmailForm(false);
    setEmailError(null);
    setEmailSuccess(false);
    onClose();
  };

  if (!quotation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PDF Preview - {quotation.quotation_number}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4">
          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-700">{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={generatePDF}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-gray-600">Generating PDF...</p>
              </div>
            </div>
          )}

          {/* PDF Preview */}
          {pdfUrl && !loading && (
            <div className="flex-1 border rounded-md overflow-hidden">
              <iframe
                ref={iframeRef}
                src={pdfUrl}
                className="w-full h-full"
                title={`PDF Preview - ${quotation.quotation_number}`}
              />
            </div>
          )}

          {/* Email Form */}
          {showEmailForm && (
            <div className="border rounded-md p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Email PDF to Customer</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmailForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailData.email}
                    onChange={(e) => setEmailData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="customer@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    value={emailData.message}
                    onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Add a personal message..."
                    rows={3}
                  />
                </div>

                {emailError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-red-700 text-sm">{emailError}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={emailLoading}>
                    {emailLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEmailForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Success Message */}
          {emailSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-green-600" />
                <span className="text-green-700">
                  PDF sent successfully to {emailData.email}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEmailForm(!showEmailForm)}
              disabled={!pdfBlob}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email PDF
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={!pdfBlob}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={!pdfBlob}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={handleClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationPDFPreview;