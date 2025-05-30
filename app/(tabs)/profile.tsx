// app/(tabs)/profile.tsx
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { UserService } from '@/services/UserService';
import type { RootStackParamList } from '@/types/navigation';
import { Profile } from '@/types/Profile';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const generateUserId = () => {
    return 'user_' + 
      Math.random().toString(36).substring(2, 15) + 
      Math.random().toString(36).substring(2, 15) + 
      Date.now().toString(36);
  };
const S3_BUCKET_URL = 'https://tfsmobile-users.s3.amazonaws.com';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const navigation = useNavigation<NavigationProp>();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Mock user data - replace with actual authentication logic later
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<Partial<Profile>>({
    name: '',
    email: '',
    password: '',
    address: '',
  });

  useEffect(() => {
    const checkExistingSession = async () => {
      setIsLoading(true);
      try {
        const storedUserId = await SecureStore.getItemAsync('userId');
        const storedEmail = await SecureStore.getItemAsync('userEmail');
        
        if (storedUserId && storedEmail) {
          setUserId(storedUserId);
          setIsLoggedIn(true);
          await fetchUserProfile(storedUserId);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkExistingSession();
  }, []);

  // Add this to your profile.tsx file, right after the useEffect that checks for existing session
  useEffect(() => {
    const debugSession = async () => {
      try {
        const storedUserId = await SecureStore.getItemAsync('userId');
        const storedEmail = await SecureStore.getItemAsync('userEmail');
        
        console.log('Debug - Stored User ID:', storedUserId);
        console.log('Debug - Stored Email:', storedEmail);
        
        if (storedUserId) {
          // Test if we can access the user's bucket
          try {
            const testUrl = `${S3_BUCKET_URL}/${storedUserId}/profile/name/name.txt`;
            console.log('Debug - Testing URL:', testUrl);
            const response = await fetch(testUrl);
            console.log('Debug - Response status:', response.status);
            if (response.ok) {
              const name = await response.text();
              console.log('Debug - Retrieved name:', name);
            }
          } catch (e) {
            console.error('Debug - Error accessing user bucket:', e);
          }
        }
      } catch (error) {
        console.error('Debug - Error checking session:', error);
      }
    };
    
    debugSession();
  }, []);

  
  const fetchUserProfile = async (id: string) => {
    setIsLoading(true);
    try {
      const userData = await UserService.getUserProfile(id);
      setProfile({
        name: userData.name || '',
        email: userData.email || '',
        address: userData.address || '',
        password: '' // Don't store password in memory
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!profile.email || !profile.password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    
    setIsLoading(true);
    try {
      const userData = await UserService.login(profile.email, profile.password);
      setUserId(userData.id);
      setIsLoggedIn(true);
      fetchUserProfile(userData.id);
      Alert.alert('Success', 'You are now logged in!');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignup = async () => {
    if (!profile.name || !profile.email || !profile.password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    
    setIsLoading(true);
    try {
      const userData = await UserService.signup(
        profile.name,
        profile.email,
        profile.password,
        profile.address
      );
      
      setUserId(userData.id);
      setIsLoggedIn(true);
      Alert.alert('Success', 'Account created successfully!');
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveProfile = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not logged in');
      return;
    }
    
    setIsLoading(true);
    try {
      if (!profile.name || !profile.email) {
        Alert.alert('Error', 'Name and email are required');
        return;
      }

      await UserService.updateUserProfile(
        userId,
        profile.name,
        profile.email,
        profile.address
      );
      
      await fetchUserProfile(userId);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      // Clear stored session data
      await SecureStore.deleteItemAsync('userId');
      await SecureStore.deleteItemAsync('userEmail');
      
      setUserId(null);
      setIsLoggedIn(false);
      setProfile({
        name: '',
        email: '',
        password: '',
        address: '',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };


  const handleNavigate = () => {
    navigation.navigate('profile_data', {
      userId: userId || undefined // Convert null to undefined
    });
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.primary }]}>
      <ThemedText type="subtitle" style={[styles.title, { color: colors.accent3 }]}>
        {isLoggedIn ? 'Your Profile' : 'Login / Sign Up'}
      </ThemedText>
      {isLoading && (
            <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.accent2} />
            </View>
            )}

      {isLoggedIn ? (
        <>
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Name</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, color: colors.text }]}
              value={profile.name}
              onChangeText={(text) => setProfile({ ...profile, name: text })}
              placeholder="Your name"
              placeholderTextColor={colors.text + '80'}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, color: colors.text }]}
              value={profile.email}
              onChangeText={(text) => setProfile({ ...profile, email: text })}
              placeholder="Your email"
              placeholderTextColor={colors.text + '80'}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Address</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, color: colors.text }]}
              value={profile.address}
              onChangeText={(text) => setProfile({ ...profile, address: text })}
              placeholder="Your address"
              placeholderTextColor={colors.text + '80'}
              multiline
            />
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent2 }]}
              onPress={handleSaveProfile}
            >
              <ThemedText style={styles.buttonText}>Save Profile</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent3 }]}
              onPress={handleNavigate}
            >
              <ThemedText style={styles.buttonText}>View My Data</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#ff6b6b' }]}
              onPress={handleLogout}
            >
              <ThemedText style={styles.buttonText}>Logout</ThemedText>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Name (for signup)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, color: colors.text }]}
              value={profile.name}
              onChangeText={(text) => setProfile({ ...profile, name: text })}
              placeholder="Your name"
              placeholderTextColor={colors.text + '80'}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, color: colors.text }]}
              value={profile.email}
              onChangeText={(text) => setProfile({ ...profile, email: text })}
              placeholder="Your email"
              placeholderTextColor={colors.text + '80'}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, color: colors.text }]}
              value={profile.password}
              onChangeText={(text) => setProfile({ ...profile, password: text })}
              placeholder="Your password"
              placeholderTextColor={colors.text + '80'}
              secureTextEntry
            />
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent2 }]}
              onPress={handleLogin}
            >
              <ThemedText style={styles.buttonText}>Login</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent3 }]}
              onPress={handleSignup}
            >
              <ThemedText style={styles.buttonText}>Sign Up</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent3 }]}
            onPress={handleNavigate}
            >
            <ThemedText style={styles.buttonText}>View My Data</ThemedText>
            </TouchableOpacity>

          </View>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  buttonGroup: {
    marginTop: 24,
    gap: 16,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  
});
