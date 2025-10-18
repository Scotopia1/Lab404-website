import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  RefreshCw,
  UserCheck,
  UserX,
  DollarSign,
  Package,
  Star,
  X,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';

interface Customer {
  id: string;
  email: string;
  is_active: boolean;
  notes: string | null;
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
  names?: CustomerName[];
  addresses?: CustomerAddress[];
  phones?: CustomerPhone[];
  orders?: any[];
}

interface CustomerName {
  id: string;
  customer_id: string;
  first_name: string;
  last_name: string | null;
  is_primary: boolean;
  used_in_orders: number;
  created_at: string;
}

interface CustomerAddress {
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
  created_at: string;
}

interface CustomerPhone {
  id: string;
  customer_id: string;
  phone: string;
  is_primary: boolean;
  used_in_orders: number;
  created_at: string;
}

export const CustomerManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const queryClient = useQueryClient();

  // Fetch customers
  const {
    data: customersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin-customers', page, limit, searchQuery, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'all' && { is_active: statusFilter }),
      });

      const response = await apiClient.get(`/admin/customers?${params}`);
      return {
        customers: response.data || [],
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 1,
        page: response.pagination?.page || 1
      };
    },
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete customer', {
        description: error.response?.data?.message || 'An error occurred',
      });
    },
  });

  // Open customer details
  const handleViewCustomer = async (customer: Customer) => {
    try {
      // apiClient.get returns the customer object directly (not wrapped in data)
      const customerDetails = await apiClient.get(`/admin/customers/${customer.id}`);
      setSelectedCustomer(customerDetails);
      setShowDetailDialog(true);
    } catch (error) {
      toast.error('Failed to load customer details');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${numAmount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customer Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage customer accounts and view order history
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Customer</DialogTitle>
                <DialogDescription>
                  Manually add a new customer to the system.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="customer@example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea id="notes" placeholder="Add any notes about this customer" rows={3} />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button>Create Customer</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Customers ({customersData?.total || 0})</span>
            <Badge variant="outline">{customersData?.customers?.length || 0} shown</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {customersData?.customers?.map((customer: Customer, index: number) => (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{customer.email}</p>
                            {customer.names && customer.names.length > 0 && (
                              <p className="text-sm text-gray-500">
                                {customer.names[0].first_name} {customer.names[0].last_name || ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.is_active ? "default" : "secondary"}>
                          {customer.is_active ? (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span>{customer.total_orders}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 font-semibold text-green-600">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatCurrency(customer.total_spent)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(customer.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewCustomer(customer)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Customer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this customer?')) {
                                  deleteCustomerMutation.mutate(customer.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Customer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {customersData && customersData.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, customersData.total)} of {customersData.total} customers
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm bg-gray-100 rounded">
                  Page {page} of {customersData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === customersData.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-2xl">{selectedCustomer.email}</DialogTitle>
                    <DialogDescription className="mt-1">
                      Customer since {formatDate(selectedCustomer.created_at)}
                    </DialogDescription>
                  </div>
                  <Badge variant={selectedCustomer.is_active ? "default" : "secondary"}>
                    {selectedCustomer.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </DialogHeader>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 my-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold">{selectedCustomer.total_orders}</p>
                      </div>
                      <Package className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Spent</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedCustomer.total_spent)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="info">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="names">Names ({selectedCustomer.names?.length || 0})</TabsTrigger>
                  <TabsTrigger value="addresses">Addresses ({selectedCustomer.addresses?.length || 0})</TabsTrigger>
                  <TabsTrigger value="orders">Orders ({selectedCustomer.orders?.length || 0})</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{selectedCustomer.email}</span>
                      </div>
                      {selectedCustomer.phones && selectedCustomer.phones.map((phone) => (
                        <div key={phone.id} className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{phone.phone}</span>
                          {phone.is_primary && <Badge variant="outline" className="ml-2">Primary</Badge>}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {selectedCustomer.notes && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">{selectedCustomer.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="names" className="space-y-2">
                  {selectedCustomer.names?.map((name) => (
                    <Card key={name.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{name.first_name} {name.last_name || ''}</p>
                            <p className="text-sm text-gray-600">Used in {name.used_in_orders} orders</p>
                          </div>
                          {name.is_primary && <Badge>Primary</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="addresses" className="space-y-2">
                  {selectedCustomer.addresses?.map((address) => (
                    <Card key={address.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                            <div>
                              <p className="font-medium">{address.address_line_1}</p>
                              {address.address_line_2 && <p className="text-sm text-gray-600">{address.address_line_2}</p>}
                              {(address.building || address.floor) && (
                                <p className="text-sm text-gray-600">
                                  {address.building && `Building: ${address.building}`}
                                  {address.building && address.floor && ', '}
                                  {address.floor && `Floor: ${address.floor}`}
                                </p>
                              )}
                              <p className="text-sm text-gray-600">{address.city}, {address.region}, {address.country}</p>
                              <p className="text-xs text-gray-500 mt-1">Used in {address.used_in_orders} orders</p>
                            </div>
                          </div>
                          {address.is_primary && <Badge>Primary</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="orders" className="space-y-2">
                  {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                    selectedCustomer.orders.map((order: any) => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Order #{order.order_number}</p>
                              <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">{formatCurrency(order.total_amount)}</p>
                              <Badge variant="outline">{order.status}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No orders yet</p>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Missing Eye import
import { Eye } from 'lucide-react';
