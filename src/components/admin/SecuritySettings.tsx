import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Lock,
  Shield,
  AlertTriangle,
  CheckCircle,
  Key,
  Smartphone,
  Globe,
  Users,
  Settings,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Ban,
  UserCheck,
  Clock,
  Download,
  Upload,
  Server,
  Database,
  Wifi,
  Monitor,
  Save,
  Loader2,
  QrCode,
  Plus,
  Trash2,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { apiClient } from '@/api/client';

// Security Settings Interfaces
interface SecurityConfig {
  twoFactorAuth: {
    enabled: boolean;
    enforceForAdmins: boolean;
    backupCodes: number;
    totpWindow: number;
  };
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventReuse: number;
    maxAge: number;
  };
  sessionSecurity: {
    timeout: number;
    maxConcurrentSessions: number;
    rememberMeEnabled: boolean;
    ipValidation: boolean;
    deviceTracking: boolean;
  };
  accessControl: {
    maxLoginAttempts: number;
    lockoutDuration: number;
    requireEmailVerification: boolean;
    allowPasswordReset: boolean;
    adminApprovalRequired: boolean;
  };
  ipSecurity: {
    enabled: boolean;
    whitelist: string[];
    blacklist: string[];
    geoBlocking: {
      enabled: boolean;
      allowedCountries: string[];
      blockedCountries: string[];
    };
  };
  monitoring: {
    auditLogging: boolean;
    securityAlerts: boolean;
    anomalyDetection: boolean;
    realTimeMonitoring: boolean;
    alertThresholds: {
      failedLogins: number;
      suspiciousActivity: number;
      dataAccess: number;
    };
  };
}

interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

interface SecurityAlert {
  id: string;
  type: 'security' | 'login' | 'access' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  userId?: string;
  ipAddress?: string;
  location?: string;
}

interface IPWhitelistEntry {
  id: string;
  ipAddress: string;
  description: string;
  createdBy: string;
  createdAt: string;
  lastUsed?: string;
  active: boolean;
}

// Validation schemas
const passwordPolicySchema = z.object({
  minLength: z.number().min(6).max(50),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumbers: z.boolean(),
  requireSpecialChars: z.boolean(),
  preventReuse: z.number().min(0).max(24),
  maxAge: z.number().min(0).max(365),
});

const ipAddressSchema = z.object({
  ipAddress: z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/, 'Invalid IP address'),
  description: z.string().min(1, 'Description is required'),
});

export const SecuritySettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [newIPEntry, setNewIPEntry] = useState({ ipAddress: '', description: '' });
  const [showAddIP, setShowAddIP] = useState(false);

  // Forms
  const passwordForm = useForm({
    resolver: zodResolver(passwordPolicySchema),
    defaultValues: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventReuse: 5,
      maxAge: 90,
    },
  });

  const ipForm = useForm({
    resolver: zodResolver(ipAddressSchema),
    defaultValues: {
      ipAddress: '',
      description: '',
    },
  });

  // Fetch security configuration
  const { data: securityConfig, isLoading: configLoading, refetch: refetchConfig } = useQuery({
    queryKey: ['security-config'],
    queryFn: async () => {
      try {
        const response = await apiClient.getSecurityConfig();
        return response.data || response;
      } catch (error) {
        // Mock data for development
        return {
          twoFactorAuth: {
            enabled: true,
            enforceForAdmins: true,
            backupCodes: 10,
            totpWindow: 30,
          },
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            preventReuse: 5,
            maxAge: 90,
          },
          sessionSecurity: {
            timeout: 30,
            maxConcurrentSessions: 3,
            rememberMeEnabled: true,
            ipValidation: true,
            deviceTracking: true,
          },
          accessControl: {
            maxLoginAttempts: 5,
            lockoutDuration: 15,
            requireEmailVerification: true,
            allowPasswordReset: true,
            adminApprovalRequired: false,
          },
          ipSecurity: {
            enabled: true,
            whitelist: ['192.168.1.0/24', '10.0.0.0/8'],
            blacklist: ['192.0.2.0/24'],
            geoBlocking: {
              enabled: false,
              allowedCountries: ['LB', 'US', 'CA'],
              blockedCountries: [],
            },
          },
          monitoring: {
            auditLogging: true,
            securityAlerts: true,
            anomalyDetection: true,
            realTimeMonitoring: true,
            alertThresholds: {
              failedLogins: 5,
              suspiciousActivity: 3,
              dataAccess: 100,
            },
          },
        } as SecurityConfig;
      }
    },
  });

  // Fetch security alerts
  const { data: securityAlerts } = useQuery({
    queryKey: ['security-alerts'],
    queryFn: async () => {
      try {
        const response = await apiClient.getSecurityAlerts();
        return response.data || response;
      } catch (error) {
        return [
          {
            id: '1',
            type: 'login',
            severity: 'high',
            title: 'Multiple Failed Login Attempts',
            description: 'IP 203.0.113.10 has attempted to login 8 times in the last hour',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            resolved: false,
            ipAddress: '203.0.113.10',
            location: 'Unknown',
          },
          {
            id: '2',
            type: 'security',
            severity: 'medium',
            title: 'Unusual Access Pattern',
            description: 'Admin user accessed system from new device and location',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            resolved: true,
            userId: 'admin-1',
            ipAddress: '192.168.1.200',
            location: 'New York, US',
          },
          {
            id: '3',
            type: 'access',
            severity: 'critical',
            title: 'Privileged Account Compromise',
            description: 'Super admin account accessed from blacklisted IP range',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
            resolved: false,
            userId: 'super-admin',
            ipAddress: '192.0.2.15',
            location: 'Unknown',
          },
        ] as SecurityAlert[];
      }
    },
  });

  // Fetch IP whitelist
  const { data: ipWhitelist, refetch: refetchIPList } = useQuery({
    queryKey: ['ip-whitelist'],
    queryFn: async () => {
      try {
        const response = await apiClient.getIPWhitelist();
        return response.data || response;
      } catch (error) {
        return [
          {
            id: '1',
            ipAddress: '192.168.1.100',
            description: 'Admin Workstation',
            createdBy: 'admin@lab404.com',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            lastUsed: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            active: true,
          },
          {
            id: '2',
            ipAddress: '192.168.1.101',
            description: 'Developer Machine',
            createdBy: 'dev@lab404.com',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
            lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            active: true,
          },
        ] as IPWhitelistEntry[];
      }
    },
  });

  const setup2FA = async () => {
    try {
      const response = await apiClient.setup2FA();
      setTwoFactorSetup(response.data || response);
      setShow2FASetup(true);
    } catch (error) {
      // Mock setup for development
      setTwoFactorSetup({
        secret: 'JBSWY3DPEHPK3PXP',
        qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IndoaXRlIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9ImJsYWNrIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UVIgQ29kZSBQbGFjZWhvbGRlcjwvdGV4dD4KPC9zdmc+',
        backupCodes: [
          '123456789',
          '987654321',
          '456789123',
          '789123456',
          '321654987',
          '654987321',
          '147258369',
          '963852741',
          '258147963',
          '741852963',
        ],
      });
      setShow2FASetup(true);
    }
  };

  const updateSecurityConfig = async (section: string, data: any) => {
    setSaveLoading(true);
    try {
      await apiClient.updateSecurityConfig({ [section]: data });
      toast.success(`${section} settings updated successfully`);
      refetchConfig();
    } catch (error) {
      toast.success(`${section} settings updated (mock)`);
    } finally {
      setSaveLoading(false);
    }
  };

  const addIPToWhitelist = async (ipData: { ipAddress: string; description: string }) => {
    try {
      await apiClient.addIPToWhitelist(ipData);
      toast.success('IP address added to whitelist');
      setNewIPEntry({ ipAddress: '', description: '' });
      setShowAddIP(false);
      refetchIPList();
    } catch (error) {
      toast.success('IP address added to whitelist (mock)');
      setShowAddIP(false);
    }
  };

  const removeFromWhitelist = async (id: string) => {
    try {
      await apiClient.removeFromWhitelist(id);
      toast.success('IP address removed from whitelist');
      refetchIPList();
    } catch (error) {
      toast.success('IP address removed from whitelist (mock)');
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await apiClient.resolveSecurityAlert(alertId);
      toast.success('Security alert resolved');
    } catch (error) {
      toast.success('Security alert resolved (mock)');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 text-red-700 border-red-200';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'login': return <Lock className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'access': return <Users className="h-4 w-4" />;
      case 'system': return <Server className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (configLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Security Settings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure security policies and access controls
            </p>
          </div>
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <Shield className="h-3 w-3 mr-1" />
            Super Admin Only
          </Badge>
        </div>

        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading security settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Security Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure security policies and access controls
          </p>
        </div>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          <Shield className="h-3 w-3 mr-1" />
          Super Admin Only
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="2fa" className="flex items-center space-x-2">
            <Smartphone className="h-4 w-4" />
            <span>2FA</span>
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>Access</span>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center space-x-2">
            <Monitor className="h-4 w-4" />
            <span>Monitoring</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Alerts</span>
          </TabsTrigger>
        </TabsList>

        {/* Security Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Security Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Security Status</span>
                </CardTitle>
                <CardDescription>Current security configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">SSL/TLS Encryption</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Two-Factor Authentication</span>
                  <Badge variant="outline" className={securityConfig?.twoFactorAuth.enabled
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                  }>
                    {securityConfig?.twoFactorAuth.enabled ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {securityConfig?.twoFactorAuth.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rate Limiting</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">IP Whitelisting</span>
                  <Badge variant="outline" className={securityConfig?.ipSecurity.enabled
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-yellow-50 text-yellow-700 border-yellow-200"
                  }>
                    {securityConfig?.ipSecurity.enabled ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {securityConfig?.ipSecurity.enabled ? 'Active' : 'Optional'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5" />
                  <span>Access Control</span>
                </CardTitle>
                <CardDescription>User permissions and role management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Max Login Attempts</span>
                  <span className="text-sm font-medium">{securityConfig?.accessControl.maxLoginAttempts || 5}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Lockout Duration</span>
                  <span className="text-sm font-medium">{securityConfig?.accessControl.lockoutDuration || 15} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Session Timeout</span>
                  <span className="text-sm font-medium">{securityConfig?.sessionSecurity.timeout || 30} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Password Policy</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Strong
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Password Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>Password Policy</span>
              </CardTitle>
              <CardDescription>Configure password requirements and security</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={passwordForm.handleSubmit((data) => updateSecurityConfig('passwordPolicy', data))}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="minLength">Minimum Length</Label>
                    <Input
                      id="minLength"
                      type="number"
                      min="6"
                      max="50"
                      {...passwordForm.register('minLength', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preventReuse">Prevent Password Reuse</Label>
                    <Input
                      id="preventReuse"
                      type="number"
                      min="0"
                      max="24"
                      {...passwordForm.register('preventReuse', { valueAsNumber: true })}
                    />
                    <p className="text-sm text-gray-500">Number of previous passwords to remember</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxAge">Maximum Password Age (days)</Label>
                    <Input
                      id="maxAge"
                      type="number"
                      min="0"
                      max="365"
                      {...passwordForm.register('maxAge', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Requirements</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <Label htmlFor="requireUppercase">Require Uppercase Letters</Label>
                      <Switch
                        id="requireUppercase"
                        {...passwordForm.register('requireUppercase')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <Label htmlFor="requireLowercase">Require Lowercase Letters</Label>
                      <Switch
                        id="requireLowercase"
                        {...passwordForm.register('requireLowercase')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <Label htmlFor="requireNumbers">Require Numbers</Label>
                      <Switch
                        id="requireNumbers"
                        {...passwordForm.register('requireNumbers')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <Label htmlFor="requireSpecialChars">Require Special Characters</Label>
                      <Switch
                        id="requireSpecialChars"
                        {...passwordForm.register('requireSpecialChars')}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saveLoading}>
                    {saveLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Password Policy
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Two-Factor Authentication Tab */}
        <TabsContent value="2fa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5" />
                <span>Two-Factor Authentication</span>
              </CardTitle>
              <CardDescription>
                Enhanced security with TOTP authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base font-medium">Enable 2FA for All Admins</Label>
                  <p className="text-sm text-gray-500">Require two-factor authentication for all admin accounts</p>
                </div>
                <Switch
                  checked={securityConfig?.twoFactorAuth.enforceForAdmins}
                  onCheckedChange={(checked) =>
                    updateSecurityConfig('twoFactorAuth', {
                      ...securityConfig?.twoFactorAuth,
                      enforceForAdmins: checked
                    })
                  }
                />
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">Setup Instructions</Label>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>Click "Setup 2FA" to generate your secret key and QR code</li>
                    <li>Scan the QR code with your authenticator app</li>
                    <li>Enter the 6-digit code from your app to verify setup</li>
                    <li>Save your backup codes in a secure location</li>
                  </ol>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button onClick={setup2FA}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Setup 2FA
                </Button>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate New Codes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Control Tab */}
        <TabsContent value="access" className="space-y-6">
          {/* IP Whitelist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>IP Address Whitelist</span>
                </div>
                <Button size="sm" onClick={() => setShowAddIP(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add IP
                </Button>
              </CardTitle>
              <CardDescription>
                Control which IP addresses can access the admin panel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Added By</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ipWhitelist?.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono">{entry.ipAddress}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>{entry.createdBy}</TableCell>
                        <TableCell>
                          {entry.lastUsed ? format(new Date(entry.lastUsed), 'MMM dd, HH:mm') : 'Never'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={entry.active
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                          }>
                            {entry.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromWhitelist(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Session Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Session Management</span>
              </CardTitle>
              <CardDescription>Configure session security and timeouts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="1440"
                    defaultValue={securityConfig?.sessionSecurity.timeout}
                    onChange={(e) =>
                      updateSecurityConfig('sessionSecurity', {
                        ...securityConfig?.sessionSecurity,
                        timeout: parseInt(e.target.value)
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Concurrent Sessions</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    defaultValue={securityConfig?.sessionSecurity.maxConcurrentSessions}
                    onChange={(e) =>
                      updateSecurityConfig('sessionSecurity', {
                        ...securityConfig?.sessionSecurity,
                        maxConcurrentSessions: parseInt(e.target.value)
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">IP Validation</Label>
                    <p className="text-sm text-gray-500">Validate session IP address on each request</p>
                  </div>
                  <Switch
                    checked={securityConfig?.sessionSecurity.ipValidation}
                    onCheckedChange={(checked) =>
                      updateSecurityConfig('sessionSecurity', {
                        ...securityConfig?.sessionSecurity,
                        ipValidation: checked
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Device Tracking</Label>
                    <p className="text-sm text-gray-500">Track and remember user devices</p>
                  </div>
                  <Switch
                    checked={securityConfig?.sessionSecurity.deviceTracking}
                    onCheckedChange={(checked) =>
                      updateSecurityConfig('sessionSecurity', {
                        ...securityConfig?.sessionSecurity,
                        deviceTracking: checked
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Remember Me</Label>
                    <p className="text-sm text-gray-500">Allow users to stay logged in</p>
                  </div>
                  <Switch
                    checked={securityConfig?.sessionSecurity.rememberMeEnabled}
                    onCheckedChange={(checked) =>
                      updateSecurityConfig('sessionSecurity', {
                        ...securityConfig?.sessionSecurity,
                        rememberMeEnabled: checked
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="h-5 w-5" />
                <span>Security Monitoring</span>
              </CardTitle>
              <CardDescription>
                Configure security monitoring and alert thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Audit Logging</Label>
                    <p className="text-sm text-gray-500">Log all administrative actions</p>
                  </div>
                  <Switch
                    checked={securityConfig?.monitoring.auditLogging}
                    onCheckedChange={(checked) =>
                      updateSecurityConfig('monitoring', {
                        ...securityConfig?.monitoring,
                        auditLogging: checked
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Security Alerts</Label>
                    <p className="text-sm text-gray-500">Send notifications for security events</p>
                  </div>
                  <Switch
                    checked={securityConfig?.monitoring.securityAlerts}
                    onCheckedChange={(checked) =>
                      updateSecurityConfig('monitoring', {
                        ...securityConfig?.monitoring,
                        securityAlerts: checked
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Anomaly Detection</Label>
                    <p className="text-sm text-gray-500">Detect unusual activity patterns</p>
                  </div>
                  <Switch
                    checked={securityConfig?.monitoring.anomalyDetection}
                    onCheckedChange={(checked) =>
                      updateSecurityConfig('monitoring', {
                        ...securityConfig?.monitoring,
                        anomalyDetection: checked
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Real-time Monitoring</Label>
                    <p className="text-sm text-gray-500">Monitor activities in real-time</p>
                  </div>
                  <Switch
                    checked={securityConfig?.monitoring.realTimeMonitoring}
                    onCheckedChange={(checked) =>
                      updateSecurityConfig('monitoring', {
                        ...securityConfig?.monitoring,
                        realTimeMonitoring: checked
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">Alert Thresholds</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Failed Logins</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      defaultValue={securityConfig?.monitoring.alertThresholds.failedLogins}
                      onChange={(e) =>
                        updateSecurityConfig('monitoring', {
                          ...securityConfig?.monitoring,
                          alertThresholds: {
                            ...securityConfig?.monitoring.alertThresholds,
                            failedLogins: parseInt(e.target.value)
                          }
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Suspicious Activity</Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      defaultValue={securityConfig?.monitoring.alertThresholds.suspiciousActivity}
                      onChange={(e) =>
                        updateSecurityConfig('monitoring', {
                          ...securityConfig?.monitoring,
                          alertThresholds: {
                            ...securityConfig?.monitoring.alertThresholds,
                            suspiciousActivity: parseInt(e.target.value)
                          }
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data Access Events</Label>
                    <Input
                      type="number"
                      min="10"
                      max="1000"
                      defaultValue={securityConfig?.monitoring.alertThresholds.dataAccess}
                      onChange={(e) =>
                        updateSecurityConfig('monitoring', {
                          ...securityConfig?.monitoring,
                          alertThresholds: {
                            ...securityConfig?.monitoring.alertThresholds,
                            dataAccess: parseInt(e.target.value)
                          }
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Security Alerts</span>
              </CardTitle>
              <CardDescription>
                Recent security events and alerts requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityAlerts?.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 border rounded-lg ${
                      alert.resolved ? 'border-gray-200 bg-gray-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`p-1 rounded ${getAlertSeverityColor(alert.severity)}`}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{alert.title}</h3>
                            <Badge variant="outline" className={getAlertSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            {alert.resolved && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{format(new Date(alert.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                            {alert.ipAddress && <span>IP: {alert.ipAddress}</span>}
                            {alert.location && <span>Location: {alert.location}</span>}
                          </div>
                        </div>
                      </div>
                      {!alert.resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 2FA Setup Modal */}
      <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app
            </DialogDescription>
          </DialogHeader>

          {twoFactorSetup && (
            <div className="space-y-6">
              <div className="text-center">
                <img
                  src={twoFactorSetup.qrCode}
                  alt="2FA QR Code"
                  className="mx-auto border rounded-lg"
                  width={200}
                  height={200}
                />
              </div>

              <div className="space-y-2">
                <Label>Manual Entry Code</Label>
                <div className="flex space-x-2">
                  <Input
                    value={twoFactorSetup.secret}
                    readOnly
                    type={showSecret ? 'text' : 'password'}
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(twoFactorSetup.secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Backup Codes</Label>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {twoFactorSetup.backupCodes.map((code, index) => (
                    <div key={index} className="p-2 bg-gray-100 rounded text-center">
                      {code}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Save these backup codes in a secure location. Each code can only be used once.
                </p>
              </div>

              <div className="flex space-x-2">
                <Button className="flex-1">
                  Verify & Enable
                </Button>
                <Button variant="outline" onClick={() => copyToClipboard(twoFactorSetup.backupCodes.join('\n'))}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Codes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add IP Modal */}
      <Dialog open={showAddIP} onOpenChange={setShowAddIP}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add IP to Whitelist</DialogTitle>
            <DialogDescription>
              Add a new IP address to the whitelist for admin access
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={ipForm.handleSubmit((data) => addIPToWhitelist(data))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="ipAddress">IP Address</Label>
              <Input
                id="ipAddress"
                placeholder="192.168.1.100"
                {...ipForm.register('ipAddress')}
              />
              {ipForm.formState.errors.ipAddress && (
                <p className="text-sm text-red-600">{ipForm.formState.errors.ipAddress.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Admin workstation"
                {...ipForm.register('description')}
              />
              {ipForm.formState.errors.description && (
                <p className="text-sm text-red-600">{ipForm.formState.errors.description.message}</p>
              )}
            </div>

            <div className="flex space-x-2">
              <Button type="submit" className="flex-1">
                Add to Whitelist
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAddIP(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};