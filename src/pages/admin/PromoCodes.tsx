import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  Tag,
  Download,
  Upload,
  FileSpreadsheet,
  TrendingUp,
  Percent,
  DollarSign,
  Calendar,
  Users,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  applies_to: 'order' | 'product';
  product_skus: string[];
  max_uses: number;
  current_uses: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PromoCodeStats {
  total_codes: number;
  active_codes: number;
  expired_codes: number;
  total_uses: number;
  total_discount_given: number;
}

export const PromoCodes: React.FC = () => {
  const queryClient = useQueryClient();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingPromoCode, setDeletingPromoCode] = useState<PromoCode | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Fetch promo codes
  const { data: promoCodesData, isLoading, refetch } = useQuery({
    queryKey: ['admin-promo-codes', searchTerm],
    queryFn: async () => {
      const params: any = { limit: 100, sort_by: 'created_at', sort_order: 'desc' };
      if (searchTerm) params.search = searchTerm;

      const response = await apiClient.get('/admin/promo-codes', { params });
      return response.data;
    },
  });

  // Fetch statistics
  const { data: stats } = useQuery<PromoCodeStats>({
    queryKey: ['promo-code-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/promo-codes/stats');
      return response.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/promo-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      queryClient.invalidateQueries({ queryKey: ['promo-code-stats'] });
      toast.success('Promo code deleted successfully');
      setShowDeleteDialog(false);
      setDeletingPromoCode(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete promo code');
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (csvData: string) => {
      const response = await apiClient.post('/admin/promo-codes/import', { csvData });
      return response.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      queryClient.invalidateQueries({ queryKey: ['promo-code-stats'] });
      toast.success(`Imported ${data.imported} promo codes. Skipped: ${data.skipped}`, {
        description: data.errors.length > 0 ? `${data.errors.length} errors occurred` : undefined,
      });
      setShowImportDialog(false);
      setImportFile(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to import promo codes');
    },
  });

  // Handle file import
  const handleImportFile = async () => {
    if (!importFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvData = e.target?.result as string;
      importMutation.mutate(csvData);
    };
    reader.readAsText(importFile);
  };

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      const response = await apiClient.get('/admin/promo-codes/template', { responseType: 'blob' });
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'promo-codes-template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded successfully');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  // Export promo codes
  const handleExport = async () => {
    try {
      const response = await apiClient.get('/admin/promo-codes/export', { responseType: 'blob' });
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `promo-codes-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Promo codes exported successfully');
    } catch (error) {
      toast.error('Failed to export promo codes');
    }
  };

  const promoCodes = promoCodesData?.promo_codes || [];

  // Calculate if promo code is expired
  const isExpired = (promoCode: PromoCode) => {
    if (!promoCode.end_date) return false;
    return new Date(promoCode.end_date) < new Date();
  };

  // Calculate remaining uses
  const getRemainingUses = (promoCode: PromoCode) => {
    if (promoCode.max_uses === 0) return 'Unlimited';
    const remaining = promoCode.max_uses - promoCode.current_uses;
    return remaining > 0 ? remaining : 0;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promo Codes</h1>
          <p className="text-gray-500 mt-1">Manage discount codes and promotions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Template
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowImportDialog(true)}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => window.location.href = '/admin/promo-codes/new'} className="gap-2">
            <Plus className="h-4 w-4" />
            New Promo Code
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold">{stats.total_codes}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold text-green-600">{stats.active_codes}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-red-600" />
                <span className="text-2xl font-bold text-red-600">{stats.expired_codes}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Uses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-2xl font-bold">{stats.total_uses}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Discount Given</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-orange-600" />
                <span className="text-2xl font-bold">${stats.total_discount_given.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Promo Codes Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : promoCodes.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No promo codes found</p>
              <Button
                onClick={() => window.location.href = '/admin/promo-codes/new'}
                className="mt-4"
              >
                Create your first promo code
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Applies To</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.map((promoCode) => (
                    <TableRow key={promoCode.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{promoCode.code}</p>
                          {promoCode.description && (
                            <p className="text-xs text-gray-500">{promoCode.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {promoCode.discount_type === 'percentage' ? (
                            <Percent className="h-3 w-3" />
                          ) : (
                            <DollarSign className="h-3 w-3" />
                          )}
                          {promoCode.discount_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {promoCode.discount_type === 'percentage'
                          ? `${promoCode.discount_value}%`
                          : `$${promoCode.discount_value.toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={promoCode.applies_to === 'order' ? 'default' : 'secondary'}>
                          {promoCode.applies_to === 'order' ? 'Entire Order' : 'Specific Products'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{promoCode.current_uses} used</p>
                          <p className="text-xs text-gray-500">{getRemainingUses(promoCode)} remaining</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="text-xs text-gray-500">
                            {format(new Date(promoCode.start_date), 'MMM d, yyyy')}
                          </p>
                          {promoCode.end_date && (
                            <p className="text-xs text-gray-500">
                              to {format(new Date(promoCode.end_date), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isExpired(promoCode) ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : promoCode.is_active ? (
                          <Badge variant="default" className="bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.location.href = `/admin/promo-codes/${promoCode.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingPromoCode(promoCode);
                                setShowDeleteDialog(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete promo code <strong>{deletingPromoCode?.code}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPromoCode && deleteMutation.mutate(deletingPromoCode.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Promo Codes</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import multiple promo codes at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-gray-500">
                Download the template to see the required format
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImportFile}
              disabled={!importFile || importMutation.isPending}
            >
              {importMutation.isPending ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromoCodes;
