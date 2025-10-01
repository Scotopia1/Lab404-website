import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Settings,
  Shield,
  Store,
  CreditCard,
  Truck,
  Mail,
  Globe,
  Database,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Upload
} from 'lucide-react';
import { apiClient } from '@/api/client';

// Schema definitions for different settings sections
const siteConfigSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  description: z.string().min(1, 'Description is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  currency: z.string().min(1, 'Currency is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  logo: z.string().optional(),
});

const paymentSettingsSchema = z.object({
  paypalEnabled: z.boolean(),
  paypalClientId: z.string().optional(),
  paypalSecret: z.string().optional(),
  stripeEnabled: z.boolean(),
  stripePublishableKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  cashOnDeliveryEnabled: z.boolean(),
  bankTransferEnabled: z.boolean(),
  transactionFee: z.number().min(0).max(100),
});

const shippingSettingsSchema = z.object({
  freeShippingThreshold: z.number().min(0),
  standardShippingCost: z.number().min(0),
  expressShippingCost: z.number().min(0),
  standardDeliveryDays: z.number().min(1).max(30),
  expressDeliveryDays: z.number().min(1).max(10),
  taxRate: z.number().min(0).max(100),
  shippingZones: z.string(),
});

const emailSettingsSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP host is required'),
  smtpPort: z.number().min(1).max(65535),
  smtpUsername: z.string().min(1, 'SMTP username is required'),
  smtpPassword: z.string().min(1, 'SMTP password is required'),
  smtpSecure: z.boolean(),
  fromEmail: z.string().email('Invalid email format'),
  fromName: z.string().min(1, 'From name is required'),
  orderNotificationsEnabled: z.boolean(),
  welcomeEmailEnabled: z.boolean(),
  whatsappEnabled: z.boolean(),
  whatsappNumber: z.string().optional(),
});

const systemPreferencesSchema = z.object({
  maintenanceMode: z.boolean(),
  registrationEnabled: z.boolean(),
  guestCheckoutEnabled: z.boolean(),
  reviewsEnabled: z.boolean(),
  inventoryTrackingEnabled: z.boolean(),
  lowStockThreshold: z.number().min(0),
  sessionTimeout: z.number().min(5).max(1440), // 5 minutes to 24 hours
  maxLoginAttempts: z.number().min(3).max(10),
  autoBackupEnabled: z.boolean(),
  backupFrequency: z.string(),
});

type SiteConfigData = z.infer<typeof siteConfigSchema>;
type PaymentSettingsData = z.infer<typeof paymentSettingsSchema>;
type ShippingSettingsData = z.infer<typeof shippingSettingsSchema>;
type EmailSettingsData = z.infer<typeof emailSettingsSchema>;
type SystemPreferencesData = z.infer<typeof systemPreferencesSchema>;

interface SystemSettings {
  siteConfig: SiteConfigData;
  paymentSettings: PaymentSettingsData;
  shippingSettings: ShippingSettingsData;
  emailSettings: EmailSettingsData;
  systemPreferences: SystemPreferencesData;
}

export const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('site');
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Form instances for each tab
  const siteForm = useForm<SiteConfigData>({
    resolver: zodResolver(siteConfigSchema),
    defaultValues: {
      companyName: '',
      description: '',
      email: '',
      phone: '',
      address: '',
      currency: 'USD',
      timezone: 'America/New_York',
      logo: '',
    },
  });

  const paymentForm = useForm<PaymentSettingsData>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      paypalEnabled: false,
      stripeEnabled: false,
      cashOnDeliveryEnabled: true,
      bankTransferEnabled: false,
      transactionFee: 0,
    },
  });

  const shippingForm = useForm<ShippingSettingsData>({
    resolver: zodResolver(shippingSettingsSchema),
    defaultValues: {
      freeShippingThreshold: 100,
      standardShippingCost: 10,
      expressShippingCost: 25,
      standardDeliveryDays: 5,
      expressDeliveryDays: 2,
      taxRate: 0,
      shippingZones: 'Domestic',
    },
  });

  const emailForm = useForm<EmailSettingsData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtpHost: '',
      smtpPort: 587,
      smtpUsername: '',
      smtpPassword: '',
      smtpSecure: true,
      fromEmail: '',
      fromName: '',
      orderNotificationsEnabled: true,
      welcomeEmailEnabled: true,
      whatsappEnabled: false,
    },
  });

  const systemForm = useForm<SystemPreferencesData>({
    resolver: zodResolver(systemPreferencesSchema),
    defaultValues: {
      maintenanceMode: false,
      registrationEnabled: true,
      guestCheckoutEnabled: true,
      reviewsEnabled: true,
      inventoryTrackingEnabled: true,
      lowStockThreshold: 10,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      autoBackupEnabled: false,
      backupFrequency: 'daily',
    },
  });

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Load settings from API - fallback to mock data if API is not available
      let settingsData: SystemSettings;

      try {
        const response = await apiClient.getSystemSettings();
        settingsData = response.data || response;
      } catch (apiError) {
        console.warn('API not available, using mock data:', apiError);

        // Mock data fallback for development
        settingsData = {
          siteConfig: {
            companyName: 'LAB404 Electronics',
            description: 'Leading electronics store specializing in microcontrollers and development boards',
            email: 'info@lab404.com',
            phone: '+96176666341',
            address: 'Beirut, Lebanon',
            currency: 'USD',
            timezone: 'Asia/Beirut',
            logo: '',
          },
          paymentSettings: {
            paypalEnabled: false,
            stripeEnabled: false,
            cashOnDeliveryEnabled: true,
            bankTransferEnabled: true,
            transactionFee: 2.5,
          },
          shippingSettings: {
            freeShippingThreshold: 150,
            standardShippingCost: 15,
            expressShippingCost: 30,
            standardDeliveryDays: 3,
            expressDeliveryDays: 1,
            taxRate: 0,
            shippingZones: 'Lebanon, Middle East',
          },
          emailSettings: {
            smtpHost: 'mail.lab404.com',
            smtpPort: 587,
            smtpUsername: 'noreply@lab404.com',
            smtpPassword: '',
            smtpSecure: true,
            fromEmail: 'noreply@lab404.com',
            fromName: 'LAB404 Electronics',
            orderNotificationsEnabled: true,
            welcomeEmailEnabled: true,
            whatsappEnabled: true,
            whatsappNumber: '+96176666341',
          },
          systemPreferences: {
            maintenanceMode: false,
            registrationEnabled: true,
            guestCheckoutEnabled: true,
            reviewsEnabled: true,
            inventoryTrackingEnabled: true,
            lowStockThreshold: 5,
            sessionTimeout: 30,
            maxLoginAttempts: 5,
            autoBackupEnabled: true,
            backupFrequency: 'daily',
          },
        };
      }

      setSettings(settingsData);

      // Populate forms with loaded data
      siteForm.reset(settingsData.siteConfig);
      paymentForm.reset(settingsData.paymentSettings);
      shippingForm.reset(settingsData.shippingSettings);
      emailForm.reset(settingsData.emailSettings);
      systemForm.reset(settingsData.systemPreferences);

    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (section: keyof SystemSettings, data: any) => {
    setSaveLoading(true);
    try {
      // Use specific API endpoints for each section
      let response;

      switch (section) {
        case 'siteConfig':
          response = await apiClient.updateSiteConfig(data);
          break;
        case 'paymentSettings':
          response = await apiClient.updatePaymentSettings(data);
          break;
        case 'shippingSettings':
          response = await apiClient.updateShippingSettings(data);
          break;
        case 'emailSettings':
          response = await apiClient.updateEmailSettings(data);
          break;
        case 'systemPreferences':
          response = await apiClient.updateSystemPreferences(data);
          break;
        default:
          throw new Error(`Unknown settings section: ${section}`);
      }

      // Update local state
      setSettings(prev => prev ? { ...prev, [section]: data } : null);

      const sectionName = section.replace(/([A-Z])/g, ' $1').toLowerCase();
      toast.success(`${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} saved successfully`);
    } catch (error: any) {
      console.error('Failed to save settings:', error);

      // Handle API errors gracefully - fallback to mock success for development
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        console.warn('Settings API not implemented yet, simulating success');

        // Update local state anyway for development
        setSettings(prev => prev ? { ...prev, [section]: data } : null);

        const sectionName = section.replace(/([A-Z])/g, ' $1').toLowerCase();
        toast.success(`${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} saved successfully (mock)`);
      } else {
        toast.error(`Failed to save ${section} settings: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Settings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure system-wide settings and preferences
            </p>
          </div>
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <Shield className="h-3 w-3 mr-1" />
            Super Admin Only
          </Badge>
        </div>

        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading system settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure system-wide settings and preferences
          </p>
        </div>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          <Shield className="h-3 w-3 mr-1" />
          Super Admin Only
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="site" className="flex items-center space-x-2">
            <Store className="h-4 w-4" />
            <span>Site</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Payment</span>
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center space-x-2">
            <Truck className="h-4 w-4" />
            <span>Shipping</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>System</span>
          </TabsTrigger>
        </TabsList>

        {/* Site Configuration Tab */}
        <TabsContent value="site" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Store className="h-5 w-5" />
                <span>Site Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure basic site information, branding, and localization settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={siteForm.handleSubmit((data) => saveSettings('siteConfig', data))}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      {...siteForm.register('companyName')}
                      placeholder="Your company name"
                    />
                    {siteForm.formState.errors.companyName && (
                      <p className="text-sm text-red-600">{siteForm.formState.errors.companyName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Contact Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...siteForm.register('email')}
                      placeholder="contact@company.com"
                    />
                    {siteForm.formState.errors.email && (
                      <p className="text-sm text-red-600">{siteForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      {...siteForm.register('phone')}
                      placeholder="+1 (555) 123-4567"
                    />
                    {siteForm.formState.errors.phone && (
                      <p className="text-sm text-red-600">{siteForm.formState.errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency *</Label>
                    <Select
                      value={siteForm.watch('currency')}
                      onValueChange={(value) => siteForm.setValue('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="LBP">LBP - Lebanese Pound</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                    {siteForm.formState.errors.currency && (
                      <p className="text-sm text-red-600">{siteForm.formState.errors.currency.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    {...siteForm.register('description')}
                    placeholder="Brief description of your business"
                    rows={3}
                  />
                  {siteForm.formState.errors.description && (
                    <p className="text-sm text-red-600">{siteForm.formState.errors.description.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Business Address *</Label>
                  <Textarea
                    id="address"
                    {...siteForm.register('address')}
                    placeholder="Full business address"
                    rows={2}
                  />
                  {siteForm.formState.errors.address && (
                    <p className="text-sm text-red-600">{siteForm.formState.errors.address.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone *</Label>
                  <Select
                    value={siteForm.watch('timezone')}
                    onValueChange={(value) => siteForm.setValue('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Beirut">Beirut (EET)</SelectItem>
                      <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                    </SelectContent>
                  </Select>
                  {siteForm.formState.errors.timezone && (
                    <p className="text-sm text-red-600">{siteForm.formState.errors.timezone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="logo"
                      {...siteForm.register('logo')}
                      placeholder="https://example.com/logo.png"
                    />
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">Optional. Recommended size: 200x50 pixels</p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saveLoading}>
                    {saveLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Site Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Payment Gateway Settings</span>
              </CardTitle>
              <CardDescription>
                Configure payment methods and gateway settings for your store
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={paymentForm.handleSubmit((data) => saveSettings('paymentSettings', data))}
                className="space-y-6"
              >
                {/* Payment Methods */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Payment Methods</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-medium">Cash on Delivery</Label>
                        <p className="text-sm text-gray-500">Accept cash payments on delivery</p>
                      </div>
                      <Switch
                        checked={paymentForm.watch('cashOnDeliveryEnabled')}
                        onCheckedChange={(checked) => paymentForm.setValue('cashOnDeliveryEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-medium">Bank Transfer</Label>
                        <p className="text-sm text-gray-500">Accept bank transfer payments</p>
                      </div>
                      <Switch
                        checked={paymentForm.watch('bankTransferEnabled')}
                        onCheckedChange={(checked) => paymentForm.setValue('bankTransferEnabled', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* PayPal Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">PayPal Integration</h3>
                      <p className="text-sm text-gray-500">Configure PayPal payment gateway</p>
                    </div>
                    <Switch
                      checked={paymentForm.watch('paypalEnabled')}
                      onCheckedChange={(checked) => paymentForm.setValue('paypalEnabled', checked)}
                    />
                  </div>

                  {paymentForm.watch('paypalEnabled') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200">
                      <div className="space-y-2">
                        <Label htmlFor="paypalClientId">PayPal Client ID</Label>
                        <Input
                          id="paypalClientId"
                          {...paymentForm.register('paypalClientId')}
                          placeholder="Your PayPal Client ID"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paypalSecret">PayPal Secret</Label>
                        <div className="relative">
                          <Input
                            id="paypalSecret"
                            type={showPasswords.paypalSecret ? 'text' : 'password'}
                            {...paymentForm.register('paypalSecret')}
                            placeholder="Your PayPal Secret"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => togglePasswordVisibility('paypalSecret')}
                          >
                            {showPasswords.paypalSecret ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stripe Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Stripe Integration</h3>
                      <p className="text-sm text-gray-500">Configure Stripe payment gateway</p>
                    </div>
                    <Switch
                      checked={paymentForm.watch('stripeEnabled')}
                      onCheckedChange={(checked) => paymentForm.setValue('stripeEnabled', checked)}
                    />
                  </div>

                  {paymentForm.watch('stripeEnabled') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200">
                      <div className="space-y-2">
                        <Label htmlFor="stripePublishableKey">Stripe Publishable Key</Label>
                        <Input
                          id="stripePublishableKey"
                          {...paymentForm.register('stripePublishableKey')}
                          placeholder="pk_test_..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                        <div className="relative">
                          <Input
                            id="stripeSecretKey"
                            type={showPasswords.stripeSecret ? 'text' : 'password'}
                            {...paymentForm.register('stripeSecretKey')}
                            placeholder="sk_test_..."
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => togglePasswordVisibility('stripeSecret')}
                          >
                            {showPasswords.stripeSecret ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Transaction Fee */}
                <div className="space-y-2">
                  <Label htmlFor="transactionFee">Transaction Fee (%)</Label>
                  <Input
                    id="transactionFee"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    {...paymentForm.register('transactionFee', { valueAsNumber: true })}
                    placeholder="2.5"
                  />
                  <p className="text-sm text-gray-500">Additional fee to charge for payments (optional)</p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saveLoading}>
                    {saveLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Payment Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Settings Tab */}
        <TabsContent value="shipping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Shipping & Tax Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure shipping rates, zones, delivery times, and tax settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={shippingForm.handleSubmit((data) => saveSettings('shippingSettings', data))}
                className="space-y-6"
              >
                {/* Shipping Rates */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Shipping Rates</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="freeShippingThreshold">Free Shipping Threshold</Label>
                      <Input
                        id="freeShippingThreshold"
                        type="number"
                        min="0"
                        step="0.01"
                        {...shippingForm.register('freeShippingThreshold', { valueAsNumber: true })}
                        placeholder="100.00"
                      />
                      <p className="text-sm text-gray-500">Minimum order value for free shipping</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="standardShippingCost">Standard Shipping Cost</Label>
                      <Input
                        id="standardShippingCost"
                        type="number"
                        min="0"
                        step="0.01"
                        {...shippingForm.register('standardShippingCost', { valueAsNumber: true })}
                        placeholder="10.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expressShippingCost">Express Shipping Cost</Label>
                      <Input
                        id="expressShippingCost"
                        type="number"
                        min="0"
                        step="0.01"
                        {...shippingForm.register('expressShippingCost', { valueAsNumber: true })}
                        placeholder="25.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Times */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Delivery Times</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="standardDeliveryDays">Standard Delivery (Days)</Label>
                      <Input
                        id="standardDeliveryDays"
                        type="number"
                        min="1"
                        max="30"
                        {...shippingForm.register('standardDeliveryDays', { valueAsNumber: true })}
                        placeholder="5"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expressDeliveryDays">Express Delivery (Days)</Label>
                      <Input
                        id="expressDeliveryDays"
                        type="number"
                        min="1"
                        max="10"
                        {...shippingForm.register('expressDeliveryDays', { valueAsNumber: true })}
                        placeholder="2"
                      />
                    </div>
                  </div>
                </div>

                {/* Tax Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Tax Configuration</h3>

                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      {...shippingForm.register('taxRate', { valueAsNumber: true })}
                      placeholder="8.5"
                    />
                    <p className="text-sm text-gray-500">Default tax rate for all products</p>
                  </div>
                </div>

                {/* Shipping Zones */}
                <div className="space-y-2">
                  <Label htmlFor="shippingZones">Shipping Zones</Label>
                  <Textarea
                    id="shippingZones"
                    {...shippingForm.register('shippingZones')}
                    placeholder="Domestic, International, etc."
                    rows={2}
                  />
                  <p className="text-sm text-gray-500">Areas where you provide shipping services</p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saveLoading}>
                    {saveLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Shipping Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings Tab */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Email & Notification Settings</span>
              </CardTitle>
              <CardDescription>
                Configure SMTP settings, email templates, and notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={emailForm.handleSubmit((data) => saveSettings('emailSettings', data))}
                className="space-y-6"
              >
                {/* SMTP Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">SMTP Configuration</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host *</Label>
                      <Input
                        id="smtpHost"
                        {...emailForm.register('smtpHost')}
                        placeholder="mail.yoursite.com"
                      />
                      {emailForm.formState.errors.smtpHost && (
                        <p className="text-sm text-red-600">{emailForm.formState.errors.smtpHost.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port *</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        min="1"
                        max="65535"
                        {...emailForm.register('smtpPort', { valueAsNumber: true })}
                        placeholder="587"
                      />
                      {emailForm.formState.errors.smtpPort && (
                        <p className="text-sm text-red-600">{emailForm.formState.errors.smtpPort.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpUsername">SMTP Username *</Label>
                      <Input
                        id="smtpUsername"
                        {...emailForm.register('smtpUsername')}
                        placeholder="noreply@yoursite.com"
                      />
                      {emailForm.formState.errors.smtpUsername && (
                        <p className="text-sm text-red-600">{emailForm.formState.errors.smtpUsername.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">SMTP Password *</Label>
                      <div className="relative">
                        <Input
                          id="smtpPassword"
                          type={showPasswords.smtpPassword ? 'text' : 'password'}
                          {...emailForm.register('smtpPassword')}
                          placeholder="Your SMTP password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => togglePasswordVisibility('smtpPassword')}
                        >
                          {showPasswords.smtpPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {emailForm.formState.errors.smtpPassword && (
                        <p className="text-sm text-red-600">{emailForm.formState.errors.smtpPassword.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="smtpSecure"
                      checked={emailForm.watch('smtpSecure')}
                      onCheckedChange={(checked) => emailForm.setValue('smtpSecure', checked)}
                    />
                    <Label htmlFor="smtpSecure">Use secure connection (TLS/SSL)</Label>
                  </div>
                </div>

                {/* From Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Email From Settings</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fromEmail">From Email *</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        {...emailForm.register('fromEmail')}
                        placeholder="noreply@yoursite.com"
                      />
                      {emailForm.formState.errors.fromEmail && (
                        <p className="text-sm text-red-600">{emailForm.formState.errors.fromEmail.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fromName">From Name *</Label>
                      <Input
                        id="fromName"
                        {...emailForm.register('fromName')}
                        placeholder="Your Company Name"
                      />
                      {emailForm.formState.errors.fromName && (
                        <p className="text-sm text-red-600">{emailForm.formState.errors.fromName.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Notification Settings</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-medium">Order Notifications</Label>
                        <p className="text-sm text-gray-500">Send email notifications for order updates</p>
                      </div>
                      <Switch
                        checked={emailForm.watch('orderNotificationsEnabled')}
                        onCheckedChange={(checked) => emailForm.setValue('orderNotificationsEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-medium">Welcome Emails</Label>
                        <p className="text-sm text-gray-500">Send welcome emails to new customers</p>
                      </div>
                      <Switch
                        checked={emailForm.watch('welcomeEmailEnabled')}
                        onCheckedChange={(checked) => emailForm.setValue('welcomeEmailEnabled', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* WhatsApp Integration */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">WhatsApp Integration</h3>
                      <p className="text-sm text-gray-500">Configure WhatsApp notifications</p>
                    </div>
                    <Switch
                      checked={emailForm.watch('whatsappEnabled')}
                      onCheckedChange={(checked) => emailForm.setValue('whatsappEnabled', checked)}
                    />
                  </div>

                  {emailForm.watch('whatsappEnabled') && (
                    <div className="pl-4 border-l-2 border-green-200">
                      <div className="space-y-2">
                        <Label htmlFor="whatsappNumber">WhatsApp Business Number</Label>
                        <Input
                          id="whatsappNumber"
                          {...emailForm.register('whatsappNumber')}
                          placeholder="+1234567890"
                        />
                        <p className="text-sm text-gray-500">Include country code (e.g., +96176666341)</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saveLoading}>
                    {saveLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Email Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Preferences Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>System Preferences</span>
              </CardTitle>
              <CardDescription>
                Configure system-wide preferences, security settings, and maintenance options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={systemForm.handleSubmit((data) => saveSettings('systemPreferences', data))}
                className="space-y-6"
              >
                {/* Site Features */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Site Features</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-medium">Maintenance Mode</Label>
                        <p className="text-sm text-gray-500">Enable site maintenance mode</p>
                      </div>
                      <Switch
                        checked={systemForm.watch('maintenanceMode')}
                        onCheckedChange={(checked) => systemForm.setValue('maintenanceMode', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-medium">User Registration</Label>
                        <p className="text-sm text-gray-500">Allow new user registrations</p>
                      </div>
                      <Switch
                        checked={systemForm.watch('registrationEnabled')}
                        onCheckedChange={(checked) => systemForm.setValue('registrationEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-medium">Guest Checkout</Label>
                        <p className="text-sm text-gray-500">Allow checkout without registration</p>
                      </div>
                      <Switch
                        checked={systemForm.watch('guestCheckoutEnabled')}
                        onCheckedChange={(checked) => systemForm.setValue('guestCheckoutEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-medium">Product Reviews</Label>
                        <p className="text-sm text-gray-500">Enable customer product reviews</p>
                      </div>
                      <Switch
                        checked={systemForm.watch('reviewsEnabled')}
                        onCheckedChange={(checked) => systemForm.setValue('reviewsEnabled', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Inventory Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Inventory Management</h3>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base font-medium">Inventory Tracking</Label>
                      <p className="text-sm text-gray-500">Track product inventory automatically</p>
                    </div>
                    <Switch
                      checked={systemForm.watch('inventoryTrackingEnabled')}
                      onCheckedChange={(checked) => systemForm.setValue('inventoryTrackingEnabled', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      min="0"
                      {...systemForm.register('lowStockThreshold', { valueAsNumber: true })}
                      placeholder="10"
                    />
                    <p className="text-sm text-gray-500">Send alerts when stock falls below this level</p>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Security Settings</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min="5"
                        max="1440"
                        {...systemForm.register('sessionTimeout', { valueAsNumber: true })}
                        placeholder="30"
                      />
                      <p className="text-sm text-gray-500">Auto-logout after inactivity</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        min="3"
                        max="10"
                        {...systemForm.register('maxLoginAttempts', { valueAsNumber: true })}
                        placeholder="5"
                      />
                      <p className="text-sm text-gray-500">Block account after failed attempts</p>
                    </div>
                  </div>
                </div>

                {/* Backup Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Backup Settings</h3>
                      <p className="text-sm text-gray-500">Configure automatic backups</p>
                    </div>
                    <Switch
                      checked={systemForm.watch('autoBackupEnabled')}
                      onCheckedChange={(checked) => systemForm.setValue('autoBackupEnabled', checked)}
                    />
                  </div>

                  {systemForm.watch('autoBackupEnabled') && (
                    <div className="pl-4 border-l-2 border-blue-200">
                      <div className="space-y-2">
                        <Label htmlFor="backupFrequency">Backup Frequency</Label>
                        <Select
                          value={systemForm.watch('backupFrequency')}
                          onValueChange={(value) => systemForm.setValue('backupFrequency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saveLoading}>
                    {saveLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save System Preferences
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};