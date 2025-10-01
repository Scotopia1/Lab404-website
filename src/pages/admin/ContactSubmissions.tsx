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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Mail,
  MoreHorizontal,
  Trash2,
  Search,
  RefreshCw,
  MessageSquare,
  CheckCircle2,
  Clock,
  Archive,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ContactSubmission {
  id: string;
  first_name: string;
  email: string;
  phone_number: string;
  message: string;
  status: 'new' | 'contacted' | 'resolved' | 'archived';
  admin_notes: string | null;
  contacted_at: string | null;
  contacted_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ContactSubmissionStats {
  total_submissions: number;
  new_submissions: number;
  contacted_submissions: number;
  resolved_submissions: number;
  archived_submissions: number;
}

export const ContactSubmissions: React.FC = () => {
  const queryClient = useQueryClient();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingSubmission, setDeletingSubmission] = useState<ContactSubmission | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch submissions
  const { data: submissionsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-contact-submissions', searchTerm, statusFilter],
    queryFn: async () => {
      const params: any = { limit: 100, sort_by: 'created_at', sort_order: 'desc' };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

      const response = await apiClient.get('/contact-submissions/admin', { params });
      return response.data;
    },
  });

  // Fetch statistics
  const { data: stats } = useQuery<ContactSubmissionStats>({
    queryKey: ['contact-submission-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/contact-submissions/admin/stats');
      return response.data;
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.put(`/contact-submissions/admin/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['contact-submission-stats'] });
      toast.success('Status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      apiClient.put(`/contact-submissions/admin/${id}`, { admin_notes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-submissions'] });
      toast.success('Notes updated successfully');
      setShowDetailsDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update notes');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/contact-submissions/admin/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['contact-submission-stats'] });
      toast.success('Submission deleted successfully');
      setShowDeleteDialog(false);
      setDeletingSubmission(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete submission');
    },
  });

  // Mark as contacted
  const markAsContactedMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/contact-submissions/admin/${id}/contacted`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['contact-submission-stats'] });
      toast.success('Marked as contacted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark as contacted');
    },
  });

  const handleViewDetails = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setAdminNotes(submission.admin_notes || '');
    setShowDetailsDialog(true);
  };

  const handleSaveNotes = () => {
    if (selectedSubmission) {
      updateNotesMutation.mutate({ id: selectedSubmission.id, notes: adminNotes });
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { label: 'New', className: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
      contacted: { label: 'Contacted', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
      resolved: { label: 'Resolved', className: 'bg-green-100 text-green-800 hover:bg-green-200' },
      archived: { label: 'Archived', className: 'bg-gray-100 text-gray-800 hover:bg-gray-200' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getWhatsAppLink = (submission: ContactSubmission) => {
    const phone = submission.phone_number.replace(/[^\d+]/g, '');
    const message = `Hello ${submission.first_name}, thank you for contacting LAB404 Electronics.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const getEmailLink = (submission: ContactSubmission) => {
    const subject = 'Re: Your Contact Form Submission - LAB404 Electronics';
    const body = `Hello ${submission.first_name},\n\nThank you for contacting LAB404 Electronics.\n\nBest regards,\nLAB404 Electronics Team`;
    return `mailto:${submission.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Submissions</h1>
          <p className="text-gray-500 mt-1">Manage customer inquiries and contact form submissions</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </motion.div>

      {/* Statistics Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_submissions}</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New</CardTitle>
              <Mail className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.new_submissions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contacted</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.contacted_submissions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved_submissions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Archived</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.archived_submissions}</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="resolved">Resolved</option>
          <option value="archived">Archived</option>
        </select>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
            <CardDescription>
              {submissionsData?.total || 0} total submission{submissionsData?.total !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : submissionsData && submissionsData.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissionsData.data.map((submission: ContactSubmission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        {format(new Date(submission.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{submission.first_name}</TableCell>
                      <TableCell>
                        <a
                          href={getEmailLink(submission)}
                          className="text-blue-600 hover:underline flex items-center gap-1"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {submission.email}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <a
                          href={getWhatsAppLink(submission)}
                          className="text-green-600 hover:underline flex items-center gap-1"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {submission.phone_number}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={submission.message}>
                          {submission.message}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(submission)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(submission.id, 'contacted')}
                              disabled={submission.status === 'contacted'}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Mark as Contacted
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(submission.id, 'resolved')}
                              disabled={submission.status === 'resolved'}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark as Resolved
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(submission.id, 'archived')}
                              disabled={submission.status === 'archived'}
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingSubmission(submission);
                                setShowDeleteDialog(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No submissions found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>View and manage submission information</DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Name</Label>
                  <p className="mt-1">{selectedSubmission.first_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedSubmission.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <p className="mt-1">
                    <a href={getEmailLink(selectedSubmission)} className="text-blue-600 hover:underline">
                      {selectedSubmission.email}
                    </a>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Phone</Label>
                  <p className="mt-1">
                    <a href={getWhatsAppLink(selectedSubmission)} className="text-green-600 hover:underline">
                      {selectedSubmission.phone_number}
                    </a>
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-700">Message</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedSubmission.message}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Submitted</Label>
                  <p className="mt-1">{format(new Date(selectedSubmission.created_at), 'PPpp')}</p>
                </div>
                {selectedSubmission.contacted_at && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Contacted</Label>
                    <p className="mt-1">{format(new Date(selectedSubmission.contacted_at), 'PPpp')}</p>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="admin-notes" className="text-sm font-medium text-gray-700">
                  Admin Notes
                </Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this submission..."
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            <Button onClick={handleSaveNotes} disabled={updateNotesMutation.isPending}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this submission? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingSubmission) {
                  deleteMutation.mutate(deletingSubmission.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContactSubmissions;
