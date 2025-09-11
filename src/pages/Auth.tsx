import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Authentication page with login, signup, and password reset functionality
 */

type AuthMode = 'login' | 'signup' | 'forgot-password';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state or search params
  const redirectTo = (location.state as any)?.from || searchParams.get('redirect') || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(redirectTo, { replace: true });
      toast.success('Welcome back!');
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  // Set initial mode from URL params
  useEffect(() => {
    const modeParam = searchParams.get('mode') as AuthMode;
    if (modeParam && ['login', 'signup', 'forgot-password'].includes(modeParam)) {
      setMode(modeParam);
    }
  }, [searchParams]);

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    // Update URL without causing navigation
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('mode', newMode);
    window.history.replaceState(null, '', `${location.pathname}?${newSearchParams.toString()}`);
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900">LAB404</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              {/* Title */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {mode === 'login' && 'Welcome Back'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'forgot-password' && 'Reset Password'}
                  </h1>
                  <p className="text-gray-600">
                    {mode === 'login' && 'Sign in to your LAB404 account'}
                    {mode === 'signup' && 'Join LAB404 Electronics community'}
                    {mode === 'forgot-password' && 'Enter your email to reset password'}
                  </p>
                </motion.div>
              </div>

              {/* Auth Forms */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: mode === 'signup' ? 20 : mode === 'login' ? -20 : 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: mode === 'signup' ? -20 : mode === 'login' ? 20 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {mode === 'login' && (
                    <div className="space-y-6">
                      <LoginForm />
                      
                      <div className="space-y-4">
                        <div className="text-center">
                          <Button
                            variant="link"
                            onClick={() => handleModeChange('forgot-password')}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            Forgot your password?
                          </Button>
                        </div>
                        
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-300" />
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          onClick={() => handleModeChange('signup')}
                          className="w-full"
                        >
                          Create Account
                        </Button>
                      </div>
                    </div>
                  )}

                  {mode === 'signup' && (
                    <div className="space-y-6">
                      <SignUpForm />
                      
                      <div className="space-y-4">
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-300" />
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          onClick={() => handleModeChange('login')}
                          className="w-full"
                        >
                          Sign In
                        </Button>
                      </div>
                    </div>
                  )}

                  {mode === 'forgot-password' && (
                    <div className="space-y-6">
                      <ForgotPasswordForm />
                      
                      <div className="text-center">
                        <Button
                          variant="link"
                          onClick={() => handleModeChange('login')}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          Back to Sign In
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8"
          >
            <p className="text-sm text-gray-500">
              By signing in, you agree to our{' '}
              <a href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;