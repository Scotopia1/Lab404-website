// Environment variable utility functions
// Centralized configuration management for the application

interface EnvConfig {
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // WhatsApp
  whatsappPhoneNumber: string;
  whatsappBusinessName: string;
  
  // Admin
  adminEmail: string;
  adminPassword: string;
  
  // Company Info
  companyName: string;
  companyAddress: string;
  companyCity: string;
  companyCountry: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  
  // Features
  enableAdminPanel: boolean;
  enableWhatsApp: boolean;
  enableContactForm: boolean;
  enableAlibabaImport: boolean;
  enableSearch: boolean;
  enableMockData: boolean;
  
  // Development
  isDev: boolean;
  apiBaseUrl: string;
  
  // External Services
  cdnUrl?: string;
  imageUploadUrl?: string;
  gaTrackingId?: string;
  facebookPixelId?: string;
}

// Get environment variable with fallback
const getEnvVar = (key: string, fallback: string = ''): string => {
  return import.meta.env[key] || fallback;
};

// Get boolean environment variable
const getBoolEnvVar = (key: string, fallback: boolean = false): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
};

// Centralized environment configuration
export const env: EnvConfig = {
  // Supabase Configuration
  supabaseUrl: getEnvVar('VITE_SUPABASE_URL', 'https://ndzypstmjawxouxazkkv.supabase.co'),
  supabaseAnonKey: getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kenlwc3RtamF3eG91eGF6a2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzMyODksImV4cCI6MjA3Mjc0OTI4OX0.UQjeTA-BrxD7K-KLY9fJM3SllfMzSmOnkGJU_FOfv1c'),
  
  // WhatsApp Configuration
  whatsappPhoneNumber: getEnvVar('VITE_WHATSAPP_PHONE_NUMBER', '+96176666341'),
  whatsappBusinessName: getEnvVar('VITE_WHATSAPP_BUSINESS_NAME', 'LAB404 Electronics'),
  
  // Admin Configuration
  adminEmail: getEnvVar('VITE_ADMIN_EMAIL', 'admin@lab404.com'),
  adminPassword: getEnvVar('VITE_ADMIN_PASSWORD', 'admin123'),
  
  // Company Information
  companyName: getEnvVar('VITE_COMPANY_NAME', 'LAB404 Electronics'),
  companyAddress: getEnvVar('VITE_COMPANY_ADDRESS', 'Your Business Address'),
  companyCity: getEnvVar('VITE_COMPANY_CITY', 'Beirut'),
  companyCountry: getEnvVar('VITE_COMPANY_COUNTRY', 'Lebanon'),
  companyPhone: getEnvVar('VITE_COMPANY_PHONE', '+961 XX XXX XXX'),
  companyEmail: getEnvVar('VITE_COMPANY_EMAIL', 'info@lab404.com'),
  companyWebsite: getEnvVar('VITE_COMPANY_WEBSITE', 'https://lab404.com'),
  
  // Feature Flags
  enableAdminPanel: getBoolEnvVar('VITE_ENABLE_ADMIN_PANEL', true),
  enableWhatsApp: getBoolEnvVar('VITE_ENABLE_WHATSAPP', true),
  enableContactForm: getBoolEnvVar('VITE_ENABLE_CONTACT_FORM', true),
  enableAlibabaImport: getBoolEnvVar('VITE_ENABLE_ALIBABA_IMPORT', true),
  enableSearch: getBoolEnvVar('VITE_ENABLE_SEARCH', true),
  enableMockData: getBoolEnvVar('VITE_ENABLE_MOCK_DATA', true),
  
  // Development Configuration
  isDev: getBoolEnvVar('VITE_DEV_MODE', true),
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3000'),
  
  // External Services
  cdnUrl: getEnvVar('VITE_CDN_URL'),
  imageUploadUrl: getEnvVar('VITE_IMAGE_UPLOAD_URL'),
  gaTrackingId: getEnvVar('VITE_GA_TRACKING_ID'),
  facebookPixelId: getEnvVar('VITE_FACEBOOK_PIXEL_ID'),
};

// Validation function to check required environment variables
export const validateEnv = (): void => {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_WHATSAPP_PHONE_NUMBER',
  ];
  
  const missing = requiredVars.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0 && !env.enableMockData) {
    console.warn('Missing environment variables:', missing);
    console.warn('Consider creating a .env.local file with required values');
  }
};

// Helper functions for common environment checks
export const isProd = (): boolean => import.meta.env.PROD;
export const isDev = (): boolean => import.meta.env.DEV;
export const isFeatureEnabled = (feature: keyof Pick<EnvConfig, 'enableAdminPanel' | 'enableWhatsApp' | 'enableContactForm' | 'enableAlibabaImport' | 'enableSearch' | 'enableMockData'>): boolean => {
  return env[feature];
};

// Export individual configurations for backward compatibility
export const supabaseConfig = {
  url: env.supabaseUrl,
  anonKey: env.supabaseAnonKey,
};

export const whatsappConfig = {
  phoneNumber: env.whatsappPhoneNumber,
  businessName: env.whatsappBusinessName,
};

export const adminConfig = {
  email: env.adminEmail,
  password: env.adminPassword,
};

export const companyConfig = {
  name: env.companyName,
  address: env.companyAddress,
  city: env.companyCity,
  country: env.companyCountry,
  phone: env.companyPhone,
  email: env.companyEmail,
  website: env.companyWebsite,
};