import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, Mail, Lock, Shield, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  showAdminMode?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  showAdminMode = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const { signIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      clearErrors();

      // Rate limiting check
      if (loginAttempts >= 3) {
        const waitTime = Math.min(30 * Math.pow(2, loginAttempts - 3), 300); // Exponential backoff
        toast.error('Too many failed attempts', {
          description: `Please wait ${waitTime} seconds before trying again.`,
        });
        setTimeout(() => setLoginAttempts(0), waitTime * 1000);
        return;
      }

      const result = await signIn(data.email, data.password, data.rememberMe);

      if (result.success) {
        setLoginAttempts(0);
        toast.success('Welcome back!', {
          description: showAdminMode ? 'Admin panel access granted.' : 'You have been successfully signed in.',
        });
        onSuccess?.();
      } else {
        setLoginAttempts(prev => prev + 1);

        // Handle specific errors with better security messaging
        if (result.error?.includes('Invalid login credentials') ||
            result.error?.includes('Invalid email or password')) {
          setError('root', {
            message: 'Invalid email or password. Please check your credentials and try again.'
          });
        } else if (result.error?.includes('Email not confirmed')) {
          setError('root', {
            message: 'Please check your email and confirm your account before signing in.'
          });
        } else if (result.error?.includes('Account locked')) {
          setError('root', {
            message: 'Your account has been temporarily locked. Please contact support.'
          });
        } else if (result.error?.includes('Access denied')) {
          setError('root', {
            message: showAdminMode ? 'Admin access denied. Insufficient privileges.' : 'Access denied.'
          });
        } else {
          setError('root', { message: 'Sign in failed. Please try again.' });
        }

        toast.error('Sign in failed', {
          description: 'Please check your credentials and try again.',
        });
      }
    } catch (error) {
      console.error('Login form error:', error);
      setError('root', { message: 'An unexpected error occurred. Please try again.' });
      toast.error('Sign in failed', {
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
    >
      {/* Admin Mode Indicator */}
      {showAdminMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center p-3 bg-orange-50 border border-orange-200 rounded-lg"
        >
          <Shield className="h-5 w-5 text-orange-600 mr-2" />
          <span className="text-sm font-medium text-orange-800">Admin Panel Access</span>
        </motion.div>
      )}

      {/* Root Error */}
      {errors.root && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Rate Limiting Warning */}
      {loginAttempts >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {loginAttempts === 2 ? 'One more failed attempt will temporarily lock your access.' : 'Multiple failed attempts detected.'}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            className={`pl-10 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
            {...register('email')}
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600"
          >
            {errors.email.message}
          </motion.p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
            {...register('password')}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none disabled:cursor-not-allowed"
            tabIndex={-1}
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600"
          >
            {errors.password.message}
          </motion.p>
        )}
      </div>

      {/* Remember Me Checkbox */}
      <div className="flex items-center space-x-2">
        <input
          id="remember"
          type="checkbox"
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
          {...register('rememberMe')}
          disabled={isLoading}
        />
        <Label htmlFor="remember" className="text-sm text-gray-600">
          Keep me signed in
        </Label>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || loginAttempts >= 3}
        className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 mr-2" />
            {showAdminMode ? 'Admin Sign In' : 'Sign In'}
          </>
        )}
      </Button>
    </motion.form>
  );
};