import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { UserManagement } from '@/components/admin/UserManagement';
import { ProductManagement } from '@/components/admin/ProductManagement';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { Analytics } from '@/components/admin/Analytics';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { AuditLogs } from '@/components/admin/AuditLogs';
import { SecuritySettings } from '@/components/admin/SecuritySettings';
import { AdminProfile } from '@/components/admin/AdminProfile';
import { BlogManagement } from '@/components/admin/BlogManagement';
import { Categories } from '@/pages/admin/Categories';
import AlibabaImport from '@/pages/AlibabaImport';

const Admin: React.FC = () => {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <Routes>
          {/* Default Dashboard */}
          <Route index element={<AdminDashboard />} />

          {/* User Management */}
          <Route path="users/*" element={<UserManagement />} />

          {/* Product Management */}
          <Route path="products/*" element={<ProductManagement />} />

          {/* Order Management */}
          <Route path="orders/*" element={<OrderManagement />} />

          {/* Analytics */}
          <Route path="analytics/*" element={<Analytics />} />

          {/* Profile Settings */}
          <Route path="profile" element={<AdminProfile />} />

          {/* Alibaba Import */}
          <Route path="alibaba-import" element={<AlibabaImport />} />

          {/* Blog Management */}
          <Route path="blogs" element={<BlogManagement />} />

          {/* Category Management */}
          <Route path="categories" element={<Categories />} />

          {/* System Settings (Super Admin Only) */}
          <Route
            path="system/settings"
            element={
              <AdminProtectedRoute requiredRole="super_admin">
                <SystemSettings />
              </AdminProtectedRoute>
            }
          />

          {/* Audit Logs (Super Admin Only) */}
          <Route
            path="system/logs"
            element={
              <AdminProtectedRoute requiredRole="super_admin">
                <AuditLogs />
              </AdminProtectedRoute>
            }
          />

          {/* Security Settings (Super Admin Only) */}
          <Route
            path="system/security"
            element={
              <AdminProtectedRoute requiredRole="super_admin">
                <SecuritySettings />
              </AdminProtectedRoute>
            }
          />
        </Routes>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default Admin;