import { authService } from './auth';
import { adminConfig } from './env';

/**
 * Utility to create the initial admin user
 * Run this in browser console to create admin account
 */
export const createAdminUser = async () => {
  console.log('🔧 Creating admin user...');
  console.log('Admin email:', adminConfig.email);
  console.log('Admin password:', adminConfig.password);

  try {
    // Attempt to create admin user using signUp
    const result = await authService.signUp({
      email: adminConfig.email,
      password: adminConfig.password,
      name: 'LAB404 Administrator'
    });
    
    if (result.error) {
      if (result.error.includes('User already registered') || result.error.includes('already exists')) {
        console.log('✅ Admin user already exists! Try signing in.');
        return { success: true, message: 'Admin user already exists' };
      } else {
        console.error('❌ Failed to create admin user:', result.error);
        return { success: false, error: result.error };
      }
    }

    if (result.data) {
      console.log('✅ Admin user created successfully!');
      console.log('User details:', result.data);
      return { success: true, data: result.data };
    }

    return { success: false, error: 'Unknown error creating admin user' };
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Test admin login after creation
 */
export const testAdminLogin = async () => {
  console.log('🔐 Testing admin login...');
  
  try {
    const result = await authService.signIn({
      email: adminConfig.email,
      password: adminConfig.password
    });

    if (result.error) {
      console.error('❌ Admin login failed:', result.error);
      return { success: false, error: result.error };
    }

    if (result.data) {
      console.log('✅ Admin login successful!');
      console.log('User:', result.data);
      console.log('Is admin:', result.data.role === 'admin');
      return { success: true, data: result.data };
    }

    return { success: false, error: 'Login failed - no data returned' };
    
  } catch (error) {
    console.error('❌ Error testing admin login:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Full admin setup - create user and test login
 */
export const setupAdmin = async () => {
  console.log('🚀 Setting up admin account...');
  console.log('=====================================');
  
  // Step 1: Create admin user
  const createResult = await createAdminUser();
  if (!createResult.success && !createResult.error?.includes('already exists')) {
    return createResult;
  }
  
  console.log('');
  
  // Step 2: Test login
  const loginResult = await testAdminLogin();
  
  console.log('');
  console.log('=====================================');
  if (loginResult.success) {
    console.log('🎉 Admin setup complete!');
    console.log('You can now sign in to /admin with:');
    console.log('Email:', adminConfig.email);
    console.log('Password: [configured in environment]');
  } else {
    console.log('❌ Admin setup failed');
    console.log('Error:', loginResult.error);
  }
  
  return loginResult;
};

// Export to window for browser console access
if (typeof window !== 'undefined') {
  (window as any).__LAB404_SETUP_ADMIN__ = setupAdmin;
  (window as any).__LAB404_CREATE_ADMIN__ = createAdminUser;
  (window as any).__LAB404_TEST_ADMIN_LOGIN__ = testAdminLogin;
  
  console.log('🔧 Admin utilities available:');
  console.log('- window.__LAB404_SETUP_ADMIN__() - Complete admin setup');
  console.log('- window.__LAB404_CREATE_ADMIN__() - Create admin user only');  
  console.log('- window.__LAB404_TEST_ADMIN_LOGIN__() - Test admin login');
}