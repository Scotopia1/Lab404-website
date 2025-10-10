import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

/**
 * Forgot password form component
 */

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      clearErrors();

      const result = await resetPassword(data.email);

      if (result.success) {
        setIsSubmitted(true);
        toast.success('Reset email sent!', {
          description: 'Please check your email for password reset instructions.',
        });
      } else {
        // Handle specific errors
        if (result.error?.includes('User not found') || result.error?.includes('Invalid email')) {
          setError('email', { message: 'No account found with this email address' });
        } else if (result.error?.includes('Email rate limit exceeded')) {
          setError('email', { message: 'Too many requests. Please wait before trying again.' });
        } else {
          setError('root', { message: result.error || 'Failed to send reset email' });
        }
        
        toast.error('Reset failed', {
          description: result.error || 'Please check your email address and try again.',
        });
      }
    } catch (error) {
      console.error('Forgot password form error:', error);
      setError('root', { message: 'An unexpected error occurred' });
      toast.error('Reset failed', {
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    const email = getValues('email');
    if (email) {
      await onSubmit({ email });
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Check Your Email
          </h3>
          <p className="text-gray-600">
            We've sent password reset instructions to{' '}
            <span className="font-medium text-gray-900">{getValues('email')}</span>
          </p>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-left">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Next Steps:
          </h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Check your email inbox (and spam folder)</li>
            <li>Click the "Reset Password" link in the email</li>
            <li>Enter your new password</li>
            <li>Sign in with your new password</li>
          </ol>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            Didn't receive the email?
          </p>
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Resend Email'
            )}
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      {/* Root Error */}
      {errors.root && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert variant="destructive">
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Instructions */}
      <div className="text-center space-y-2 mb-6">
        <p className="text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

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
            placeholder="Enter your email address"
            className={`pl-10 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
            {...register('email')}
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

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sending reset email...
          </>
        ) : (
          'Send Reset Email'
        )}
      </Button>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
      >
        <div className="flex items-start space-x-2">
          <Mail className="h-4 w-4 text-gray-500 mt-0.5" />
          <div className="text-xs text-gray-600">
            <p className="font-medium mb-1">Security Note</p>
            <p>
              For your security, password reset links are only valid for 24 hours. 
              If you don't receive an email within a few minutes, please check your spam folder.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.form>
  );
};