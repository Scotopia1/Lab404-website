import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Eye, EyeOff, Loader2, Mail, Lock, User, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

/**
 * Sign up form component with password strength validation
 */

const signUpSchema = z.object({
  name: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  acceptTerms: z
    .boolean()
    .refine(val => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
}

export const SignUpForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    color: 'red',
  });
  const { signUp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    watch,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur',
  });

  const watchPassword = watch('password');

  // Calculate password strength
  React.useEffect(() => {
    if (!watchPassword) {
      setPasswordStrength({ score: 0, feedback: [], color: 'red' });
      return;
    }

    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (watchPassword.length >= 8) {
      score += 25;
    } else {
      feedback.push('At least 8 characters');
    }

    // Lowercase check
    if (/(?=.*[a-z])/.test(watchPassword)) {
      score += 25;
    } else {
      feedback.push('One lowercase letter');
    }

    // Uppercase check
    if (/(?=.*[A-Z])/.test(watchPassword)) {
      score += 25;
    } else {
      feedback.push('One uppercase letter');
    }

    // Number check
    if (/(?=.*\d)/.test(watchPassword)) {
      score += 25;
    } else {
      feedback.push('One number');
    }

    let color = 'red';
    if (score >= 100) color = 'green';
    else if (score >= 75) color = 'yellow';
    else if (score >= 50) color = 'orange';

    setPasswordStrength({ score, feedback, color });
  }, [watchPassword]);

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setIsLoading(true);
      clearErrors();

      const result = await signUp(data.email, data.password, data.name);

      if (result.success) {
        toast.success('Account created successfully!', {
          description: 'Please check your email to confirm your account.',
        });
      } else {
        // Handle specific errors
        if (result.error?.includes('User already registered')) {
          setError('email', { message: 'An account with this email already exists' });
        } else if (result.error?.includes('Password should be at least')) {
          setError('password', { message: result.error });
        } else if (result.error?.includes('Invalid email')) {
          setError('email', { message: 'Please enter a valid email address' });
        } else {
          setError('root', { message: result.error || 'Sign up failed' });
        }
        
        toast.error('Sign up failed', {
          description: result.error || 'Please check your information and try again.',
        });
      }
    } catch (error) {
      console.error('Sign up form error:', error);
      setError('root', { message: 'An unexpected error occurred' });
      toast.error('Sign up failed', {
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score === 0) return '';
    if (passwordStrength.score <= 25) return 'Weak';
    if (passwordStrength.score <= 50) return 'Fair';
    if (passwordStrength.score <= 75) return 'Good';
    return 'Strong';
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.color) {
      case 'red': return 'bg-red-500';
      case 'orange': return 'bg-orange-500';
      case 'yellow': return 'bg-yellow-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

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

      {/* Full Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
          Full Name
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Enter your full name"
            className={`pl-10 ${errors.name ? 'border-red-500 focus:border-red-500' : ''}`}
            {...register('name')}
          />
        </div>
        {errors.name && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600"
          >
            {errors.name.message}
          </motion.p>
        )}
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
            placeholder="Enter your email"
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
            autoComplete="new-password"
            placeholder="Create a password"
            className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        
        {/* Password Strength Indicator */}
        <AnimatePresence>
          {watchPassword && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <Progress 
                    value={passwordStrength.score} 
                    className="h-2"
                  />
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                    style={{ width: `${passwordStrength.score}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600">
                  {getPasswordStrengthText()}
                </span>
              </div>
              
              {passwordStrength.feedback.length > 0 && (
                <div className="text-xs text-gray-600">
                  <span>Password needs: </span>
                  {passwordStrength.feedback.join(', ')}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
          Confirm Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Confirm your password"
            className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600"
          >
            {errors.confirmPassword.message}
          </motion.p>
        )}
      </div>

      {/* Terms and Conditions Checkbox */}
      <div className="space-y-2">
        <div className="flex items-start space-x-2">
          <input
            id="acceptTerms"
            type="checkbox"
            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            {...register('acceptTerms')}
          />
          <Label htmlFor="acceptTerms" className="text-sm text-gray-600 leading-5">
            I agree to the{' '}
            <a href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </Label>
        </div>
        {errors.acceptTerms && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600"
          >
            {errors.acceptTerms.message}
          </motion.p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || passwordStrength.score < 100}
        className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>

      {/* Email Verification Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-3 bg-blue-50 rounded-lg border border-blue-200"
      >
        <div className="flex items-start space-x-2">
          <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-700">
            <p className="font-medium">Email verification required</p>
            <p>After signing up, please check your email and click the confirmation link to activate your account.</p>
          </div>
        </div>
      </motion.div>
    </motion.form>
  );
};