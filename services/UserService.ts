// services/UserService.ts
import * as SecureStore from 'expo-secure-store';

const S3_BUCKET_URL = 'https://tfsmobile-users.s3.amazonaws.com';

export interface User {
  id: string;
  name: string;
  email: string;
  address?: string;
}

// First, let's define a custom error type
interface UserServiceError extends Error {
  status?: number;
  statusText?: string;
}

export class UserService {
  static async signup(name: string, email: string, password: string, address?: string): Promise<User> {
    try {
      console.log('Starting signup process...');
      
      // Generate a unique user ID
      const userId = 'user_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      console.log('Generated userId:', userId);
      
      // Create user data
      const userData = { id: userId, name, email, address };
      console.log('Created userData:', userData);
      
      // Create directories and files
      console.log('Creating user directories...');
      await this.createUserDirectories(userId);
      
      console.log('Saving user data...');
      await this.saveUserData(userId, name, email, password, address);
      
      console.log('Updating users list...');
      await this.updateUsersList(userData);
      
      // Store user session
      console.log('Storing session data...');
      await SecureStore.setItemAsync('userId', userId);
      await SecureStore.setItemAsync('userEmail', email);
      
      console.log('Signup completed successfully');
      return userData;
    } catch (error: unknown) {
      console.error('Signup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to create account: ${errorMessage}`);
    }
  }
  
  static async login(email: string, password: string): Promise<User> {
    try {
      console.log('Starting login process...');
      
      // Get users list
      console.log('Fetching users list...');
      const response = await fetch(`${S3_BUCKET_URL}/users.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }
      
      const users = await response.json();
      console.log('Found users:', users);
      
      const user = users.find((u: any) => u.email === email);
      if (!user) {
        throw new Error('User not found');
      }
      console.log('Found user:', user);
      
      // Check password
      console.log('Verifying password...');
      const passwordResponse = await fetch(`${S3_BUCKET_URL}/${user.id}/profile/password/password.txt`);
      if (!passwordResponse.ok) {
        throw new Error(`Failed to verify password: ${passwordResponse.status} ${passwordResponse.statusText}`);
      }
      
      const storedPassword = await passwordResponse.text();
      if (password !== storedPassword) {
        throw new Error('Invalid password');
      }
      
      // Store user session
      console.log('Storing session data...');
      await SecureStore.setItemAsync('userId', user.id);
      await SecureStore.setItemAsync('userEmail', user.email);
      
      console.log('Login completed successfully');
      return user;
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Login failed: ${errorMessage}`);
    }
  }
  
  static async getUserProfile(userId: string): Promise<User> {
    try {
      // Get name
      const nameResponse = await fetch(`${S3_BUCKET_URL}/${userId}/profile/name/name.txt`);
      const name = await nameResponse.text();
      
      // Get email
      const emailResponse = await fetch(`${S3_BUCKET_URL}/${userId}/profile/email/email.txt`);
      const email = await emailResponse.text();
      
      // Try to get address
      let address = '';
      try {
        const addressResponse = await fetch(`${S3_BUCKET_URL}/${userId}/profile/address/address.txt`);
        if (addressResponse.ok) {
          address = await addressResponse.text();
        }
      } catch (e) {
        // Address might not exist, ignore error
      }
      
      return { id: userId, name, email, address };
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }
  
  static async updateUserProfile(userId: string, name: string, email: string, address?: string): Promise<void> {
    try {
      // First save individual profile files
      const nameBlob = new Blob([name], { type: 'text/plain' });
      const emailBlob = new Blob([email], { type: 'text/plain' });
      
      const nameResponse = await fetch(`${S3_BUCKET_URL}/${userId}/profile/name/name.txt`, {
        method: 'PUT',
        body: nameBlob
      });
      if (!nameResponse.ok) throw new Error('Failed to update name');
      
      const emailResponse = await fetch(`${S3_BUCKET_URL}/${userId}/profile/email/email.txt`, {
        method: 'PUT',
        body: emailBlob
      });
      if (!emailResponse.ok) throw new Error('Failed to update email');
      
      if (address) {
        const addressBlob = new Blob([address], { type: 'text/plain' });
        const addressResponse = await fetch(`${S3_BUCKET_URL}/${userId}/profile/address/address.txt`, {
          method: 'PUT',
          body: addressBlob
        });
        if (!addressResponse.ok) throw new Error('Failed to update address');
      }
      
      // Then update the user in the users list
      let users: User[] = [];
      try {
        const listResponse = await fetch(`${S3_BUCKET_URL}/users.json`);
        if (listResponse.ok) {
          users = await listResponse.json();
        }
      } catch (e) {
        // Users list might not exist yet
      }
      
      // Update user in the list
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        users[userIndex] = { id: userId, name, email, address };
      }
      
      // Update the users list file
      const usersBlob = new Blob([JSON.stringify(users)], { type: 'application/json' });
      const listUpdateResponse = await fetch(`${S3_BUCKET_URL}/users.json`, {
        method: 'PUT',
        body: usersBlob
      });
      
      if (!listUpdateResponse.ok) throw new Error('Failed to update users list');
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }
  
  private static async verifyS3Access(): Promise<boolean> {
    try {
      const response = await fetch(`${S3_BUCKET_URL}/test.txt`, {
        method: 'PUT',
        body: new Blob(['test'], { type: 'text/plain' })
      });
      return response.ok;
    } catch (error) {
      console.error('S3 access verification failed:', error);
      return false;
    }
  }
  
  private static async saveUserData(userId: string, name: string, email: string, password: string, address?: string): Promise<void> {
    try {
      console.log('Saving user data for userId:', userId);
      
      // First, verify S3 access
      const hasAccess = await this.verifyS3Access();
      if (!hasAccess) {
        throw new Error('Cannot access S3 bucket. Please check bucket permissions and URL.');
      }

      // Create text blobs
      const nameBlob = new Blob([name], { type: 'text/plain' });
      const emailBlob = new Blob([email], { type: 'text/plain' });
      const passwordBlob = new Blob([password], { type: 'text/plain' });
      
      // Log the full URLs we're trying to access
      const nameUrl = `${S3_BUCKET_URL}/${userId}/profile/name/name.txt`;
      const emailUrl = `${S3_BUCKET_URL}/${userId}/profile/email/email.txt`;
      const passwordUrl = `${S3_BUCKET_URL}/${userId}/profile/password/password.txt`;
      
      console.log('Attempting to save to URLs:', {
        nameUrl,
        emailUrl,
        passwordUrl
      });

      // Upload to S3 with proper error handling and headers
      const headers = {
        'Content-Type': 'text/plain',
      };

      // Save name
      console.log('Saving name...');
      const nameResponse = await fetch(nameUrl, {
        method: 'PUT',
        headers,
        body: nameBlob
      });
      if (!nameResponse.ok) {
        console.error('Name save failed:', {
          status: nameResponse.status,
          statusText: nameResponse.statusText,
          url: nameUrl
        });
        throw new Error(`Failed to save name: ${nameResponse.status} ${nameResponse.statusText}`);
      }
      
      // Save email
      console.log('Saving email...');
      const emailResponse = await fetch(emailUrl, {
        method: 'PUT',
        headers,
        body: emailBlob
      });
      if (!emailResponse.ok) {
        console.error('Email save failed:', {
          status: emailResponse.status,
          statusText: emailResponse.statusText,
          url: emailUrl
        });
        throw new Error(`Failed to save email: ${emailResponse.status} ${emailResponse.statusText}`);
      }
      
      // Save password
      console.log('Saving password...');
      const passwordResponse = await fetch(passwordUrl, {
        method: 'PUT',
        headers,
        body: passwordBlob
      });
      if (!passwordResponse.ok) {
        console.error('Password save failed:', {
          status: passwordResponse.status,
          statusText: passwordResponse.statusText,
          url: passwordUrl
        });
        throw new Error(`Failed to save password: ${passwordResponse.status} ${passwordResponse.statusText}`);
      }
      
      // Save address if provided
      if (address) {
        console.log('Saving address...');
        const addressBlob = new Blob([address], { type: 'text/plain' });
        const addressUrl = `${S3_BUCKET_URL}/${userId}/profile/address/address.txt`;
        const addressResponse = await fetch(addressUrl, {
          method: 'PUT',
          headers,
          body: addressBlob
        });
        if (!addressResponse.ok) {
          console.error('Address save failed:', {
            status: addressResponse.status,
            statusText: addressResponse.statusText,
            url: addressUrl
          });
          throw new Error(`Failed to save address: ${addressResponse.status} ${addressResponse.statusText}`);
        }
      }
      
      console.log('User data saved successfully');
    } catch (error: unknown) {
      console.error('Error saving user data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to save user data: ${errorMessage}`);
    }
  }
  
  private static async createUserDirectories(userId: string): Promise<void> {
    try {
      console.log('Creating directories for userId:', userId);
      
      // Create a .keep file in each directory to ensure they exist
      const directories = [
        `${userId}/profile/name`,
        `${userId}/profile/email`,
        `${userId}/profile/password`,
        `${userId}/profile/address`,
        `${userId}/data/gen_images`,
        `${userId}/data/user_images`,
        `${userId}/data/texts`,
        `${userId}/data/designs`,
        `${userId}/data/orders`
      ];
      
      const headers = {
        'Content-Type': 'text/plain',
      };

      for (const dir of directories) {
        const url = `${S3_BUCKET_URL}/${dir}/.keep`;
        console.log('Creating directory:', url);
        
        const response = await fetch(url, {
          method: 'PUT',
          headers,
          body: new Blob([''], { type: 'text/plain' })
        });
        
        if (!response.ok) {
          console.error('Failed to create directory:', {
            directory: dir,
            status: response.status,
            statusText: response.statusText
          });
          throw new Error(`Failed to create directory ${dir}: ${response.status} ${response.statusText}`);
        }
      }
      
      console.log('All directories created successfully');
    } catch (error: unknown) {
      console.error('Error creating directories:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to create user directories: ${errorMessage}`);
    }
  }
  
  private static async updateUsersList(userData: User): Promise<void> {
    try {
      console.log('Updating users list with:', userData);
      
      // Get existing users list
      let users: User[] = [];
      try {
        const response = await fetch(`${S3_BUCKET_URL}/users.json`);
        if (response.ok) {
          users = await response.json();
        }
      } catch (e) {
        console.log('No existing users list found, creating new one');
      }
      
      // Add new user
      users.push(userData);
      
      // Upload updated list
      const usersBlob = new Blob([JSON.stringify(users)], { type: 'application/json' });
      const updateResponse = await fetch(`${S3_BUCKET_URL}/users.json`, {
        method: 'PUT',
        body: usersBlob
      });
      
      if (!updateResponse.ok) {
        throw new Error(`Failed to update users list: ${updateResponse.status} ${updateResponse.statusText}`);
      }
      
      console.log('Users list updated successfully');
    } catch (error: unknown) {
      console.error('Error updating users list:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to update users list: ${errorMessage}`);
    }
  }
}
