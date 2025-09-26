import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '@/api/client';
import { User, Mail, Phone, Calendar, Shield, Edit3, Camera, Key, Save, X, Upload } from 'lucide-react';

// Profile form validation schema
const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 characters').optional().or(z.literal('')),
});

// Password change form validation schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export const AdminProfile: React.FC = () => {
  const { user, refreshAuth } = useAuth();
  const { toast } = useToast();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Handle profile update
  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      await apiClient.updateProfile({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
      });

      await refreshAuth();
      setIsEditingProfile(false);
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change
  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      await apiClient.changePassword(data.currentPassword, data.newPassword);

      setIsPasswordDialogOpen(false);
      passwordForm.reset();
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle avatar file selection
  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Avatar image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setSelectedAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Handle avatar upload (placeholder for now)
  const handleAvatarUpload = async () => {
    if (!selectedAvatar) return;

    setIsLoading(true);
    try {
      // Future enhancement: Implement avatar upload to backend
      // This will require backend endpoint for file upload
      // await apiClient.uploadAvatar(selectedAvatar);

      toast({
        title: "Avatar upload",
        description: "Avatar upload feature will be implemented in the next phase.",
      });

      setIsAvatarDialogOpen(false);
      setSelectedAvatar(null);
      setAvatarPreview(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset profile form when user data changes
  React.useEffect(() => {
    if (user) {
      profileForm.reset({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user, profileForm]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account settings and personal information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="relative mx-auto">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage src={user?.avatar_url || ''} alt={user?.full_name || ''} />
                <AvatarFallback className="text-xl">
                  {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'}
                </AvatarFallback>
              </Avatar>
              <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Change Avatar</DialogTitle>
                    <DialogDescription>
                      Upload a new profile picture. Images should be square and under 5MB.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Avatar className="h-32 w-32">
                        <AvatarImage src={avatarPreview || user?.avatar_url || ''} alt="Avatar preview" />
                        <AvatarFallback className="text-2xl">
                          {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex justify-center">
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <Button variant="outline" asChild>
                          <span className="flex items-center space-x-2">
                            <Upload className="h-4 w-4" />
                            <span>Choose Image</span>
                          </span>
                        </Button>
                        <Input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarSelect}
                        />
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAvatarDialogOpen(false);
                        setSelectedAvatar(null);
                        setAvatarPreview(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAvatarUpload}
                      disabled={!selectedAvatar || isLoading}
                    >
                      {isLoading ? 'Uploading...' : 'Upload Avatar'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <CardTitle>{user?.full_name || 'Administrator'}</CardTitle>
            <CardDescription className="flex items-center justify-center space-x-1">
              <Shield className="h-4 w-4" />
              <span>{user?.role?.replace('_', ' ').toUpperCase()}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Mail className="h-4 w-4" />
              <span>{user?.email}</span>
            </div>
            {user?.phone && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <Phone className="h-4 w-4" />
                <span>{user.phone}</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Calendar className="h-4 w-4" />
              <span>Joined {new Date(user?.created_at || '').toLocaleDateString()}</span>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and choose a new one.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        {...passwordForm.register('currentPassword')}
                        className={passwordForm.formState.errors.currentPassword ? 'border-red-500' : ''}
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-sm text-red-500">
                          {passwordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        {...passwordForm.register('newPassword')}
                        className={passwordForm.formState.errors.newPassword ? 'border-red-500' : ''}
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-sm text-red-500">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...passwordForm.register('confirmPassword')}
                        className={passwordForm.formState.errors.confirmPassword ? 'border-red-500' : ''}
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-500">
                          {passwordForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsPasswordDialogOpen(false);
                          passwordForm.reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Changing...' : 'Change Password'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your personal information and account settings</CardDescription>
              </div>
              {!isEditingProfile ? (
                <Button onClick={() => setIsEditingProfile(true)} variant="outline">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingProfile(false);
                      profileForm.reset();
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={profileForm.handleSubmit(onProfileSubmit)}
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    {...profileForm.register('full_name')}
                    disabled={!isEditingProfile}
                    className={profileForm.formState.errors.full_name ? 'border-red-500' : ''}
                  />
                  {profileForm.formState.errors.full_name && (
                    <p className="text-sm text-red-500">
                      {profileForm.formState.errors.full_name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...profileForm.register('email')}
                    disabled={!isEditingProfile}
                    className={profileForm.formState.errors.email ? 'border-red-500' : ''}
                  />
                  {profileForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {profileForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  {...profileForm.register('phone')}
                  disabled={!isEditingProfile}
                  className={profileForm.formState.errors.phone ? 'border-red-500' : ''}
                  placeholder="Optional"
                />
                {profileForm.formState.errors.phone && (
                  <p className="text-sm text-red-500">
                    {profileForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              {!isEditingProfile && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <div className="text-center">
                    <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Profile Management</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
                      Click "Edit Profile" to update your personal information, or use the "Change Password" button to update your security credentials.
                    </p>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};