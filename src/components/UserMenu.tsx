import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  ShoppingBag, 
  ChevronDown,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * User menu component with authentication actions and user info
 */

interface UserMenuProps {
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ className = '' }) => {
  const { user, isAuthenticated, isLoading, signOut, isAdmin } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    } finally {
      setIsSigningOut(false);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getAvatarUrl = (user: any) => {
    // Generate a deterministic avatar based on user email
    const hash = user.email.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colors = ['blue', 'green', 'purple', 'red', 'yellow', 'pink'];
    const colorIndex = Math.abs(hash) % colors.length;
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=${colors[colorIndex]}&color=fff&size=40`;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Button asChild variant="ghost" size="sm">
          <Link to="/auth?mode=login">
            <User className="h-4 w-4 mr-2" />
            Sign In
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/auth?mode=signup">
            Sign Up
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center space-x-2 h-auto p-2 hover:bg-gray-100"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={user.avatar || getAvatarUrl(user)} 
                alt={user.name}
              />
              <AvatarFallback className="text-xs">
                {getUserInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="hidden sm:flex flex-col items-start">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">
                  {user.name}
                </span>
                {isAdmin() && (
                  <Badge variant="default" className="text-xs px-1 py-0">
                    Admin
                  </Badge>
                )}
              </div>
              <span className="text-xs text-gray-500">{user.email}</span>
            </div>
            
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          {/* User Info Header */}
          <DropdownMenuLabel>
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={user.avatar || getAvatarUrl(user)} 
                  alt={user.name}
                />
                <AvatarFallback>
                  {getUserInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  {isAdmin() && (
                    <Badge variant="default" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* User Actions */}
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex items-center cursor-pointer">
              <User className="h-4 w-4 mr-3" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/orders" className="flex items-center cursor-pointer">
              <ShoppingBag className="h-4 w-4 mr-3" />
              <span>My Orders</span>
            </Link>
          </DropdownMenuItem>


          <DropdownMenuSeparator />

          {/* Admin Actions */}
          {isAdmin() && (
            <>
              <DropdownMenuItem asChild>
                <Link to="/admin" className="flex items-center cursor-pointer">
                  <Shield className="h-4 w-4 mr-3" />
                  <span>Admin Panel</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Settings */}
          <DropdownMenuItem asChild>
            <Link to="/settings" className="flex items-center cursor-pointer">
              <Settings className="h-4 w-4 mr-3" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Sign Out */}
          <DropdownMenuItem 
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center cursor-pointer text-red-600 focus:text-red-600"
          >
            {isSigningOut ? (
              <Loader2 className="h-4 w-4 mr-3 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 mr-3" />
            )}
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Simplified version for mobile use
export const MobileUserMenu: React.FC<UserMenuProps> = ({ className = '' }) => {
  const { user, isAuthenticated, signOut, isAdmin } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Link
          to="/auth?mode=login"
          className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
        >
          <User className="h-5 w-5 mr-3" />
          Sign In
        </Link>
        <Link
          to="/auth?mode=signup"
          className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* User Info */}
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="text-sm">
              {user.name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              {isAdmin() && (
                <Badge variant="default" className="text-xs">
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <Link
        to="/profile"
        className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
      >
        <User className="h-5 w-5 mr-3" />
        Profile
      </Link>

      <Link
        to="/orders"
        className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
      >
        <ShoppingBag className="h-5 w-5 mr-3" />
        My Orders
      </Link>

      {isAdmin() && (
        <Link
          to="/admin"
          className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
        >
          <Shield className="h-5 w-5 mr-3" />
          Admin Panel
        </Link>
      )}

      <button
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {isSigningOut ? (
          <Loader2 className="h-5 w-5 mr-3 animate-spin" />
        ) : (
          <LogOut className="h-5 w-5 mr-3" />
        )}
        Sign Out
      </button>
    </div>
  );
};

export default UserMenu;