import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Bell,
  Search,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  User,
  HelpCircle,
  ExternalLink,
  Activity,
  Database,
  Lock,
  AlertTriangle,
  FileText,
  Folder,
  Import,
  Tag,
  MessageSquare,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { NotificationDashboard } from './NotificationDashboard';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
  requiredRole?: 'admin' | 'super_admin';
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin',
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    href: '/admin/users',
    badge: 'new',
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    href: '/admin/products',
  },
  {
    id: 'alibaba-import',
    label: 'Alibaba Import',
    icon: Import,
    href: '/admin/alibaba-import',
    badge: 'pro',
  },
  {
    id: 'categories',
    label: 'Categories',
    icon: Folder,
    href: '/admin/categories',
  },
  {
    id: 'promo-codes',
    label: 'Promo Codes',
    icon: Tag,
    href: '/admin/promo-codes',
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: ShoppingCart,
    href: '/admin/orders',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
  },
  {
    id: 'contact-submissions',
    label: 'Contact Submissions',
    icon: MessageSquare,
    href: '/admin/contact-submissions',
  },
  {
    id: 'blogs',
    label: 'Blog Management',
    icon: FileText,
    href: '/admin/blogs',
  },
  {
    id: 'system',
    label: 'System',
    icon: Database,
    href: '/admin/system',
    requiredRole: 'super_admin',
    children: [
      {
        id: 'system-settings',
        label: 'Settings',
        icon: Settings,
        href: '/admin/system/settings',
        requiredRole: 'super_admin',
      },
      {
        id: 'system-logs',
        label: 'Audit Logs',
        icon: Activity,
        href: '/admin/system/logs',
        requiredRole: 'super_admin',
      },
      {
        id: 'system-security',
        label: 'Security',
        icon: Lock,
        href: '/admin/system/security',
        requiredRole: 'super_admin',
      },
    ],
  },
];

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('admin-dark-mode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('admin-dark-mode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Check if user has access to nav item
  const hasAccess = (item: NavItem) => {
    if (!item.requiredRole) return true;
    if (user?.role === 'super_admin') return true;
    return user?.role === item.requiredRole;
  };

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter(hasAccess);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const isActiveRoute = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const isActive = isActiveRoute(item.href);
    const Icon = item.icon;

    return (
      <div key={item.id}>
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          className={`
            w-full justify-start mb-1 transition-all duration-200
            ${sidebarCollapsed ? 'px-2' : 'px-4'}
            ${depth > 0 ? 'ml-4 w-[calc(100%-1rem)]' : ''}
            ${isActive ? 'bg-blue-100 text-blue-700 border-blue-200' : 'hover:bg-gray-100'}
          `}
          onClick={() => navigate(item.href)}
        >
          <Icon className={`h-4 w-4 ${sidebarCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center justify-between w-full"
              >
                <span className="text-sm font-medium truncate">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Button>

        {/* Render children if expanded */}
        {item.children && !sidebarCollapsed && (
          <div className="ml-4 space-y-1">
            {item.children.filter(hasAccess).map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarCollapsed ? '4rem' : '16rem' }}
        className="fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-30 shadow-sm"
      >
        {/* Logo/Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-2"
              >
                <Shield className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">LAB404</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Search */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search admin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredNavItems.map(item => renderNavItem(item))}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full justify-start p-2 ${sidebarCollapsed ? 'px-2' : ''}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar_url || ''} alt={user?.full_name || ''} />
                  <AvatarFallback>
                    {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'}
                  </AvatarFallback>
                </Avatar>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="ml-3 text-left flex-1"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user?.full_name || 'Administrator'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user?.email}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <Badge variant="outline" className="w-fit text-xs">
                    {user?.role?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/admin/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open('/help', '_blank')}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
                <ExternalLink className="ml-auto h-3 w-3" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div
        className={`transition-all duration-200 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        {/* Top Bar */}
        <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            {/* Breadcrumb would go here */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Admin</span>
              {location.pathname !== '/admin' && (
                <>
                  <span>/</span>
                  <span className="text-gray-900 dark:text-white capitalize">
                    {location.pathname.split('/').pop()?.replace('-', ' ')}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* System Status */}
            <div className="flex items-center space-x-2 text-sm">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600 dark:text-gray-400">System Online</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children || <Outlet />}
        </main>

        {/* Notification Dashboard - Floating overlay */}
        <NotificationDashboard />
      </div>
    </div>
  );
};