import { API_ENDPOINTS } from '@/app/config';
import { useNavigationState } from '@/app/contexts/NavigationContext';
import { useProduct } from '@/app/contexts/ProductContext';
import GenerateScreenHeader from '@/components/GenerateScreenHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ProfileService } from '@/services/ProfileService';
import type { RootStackParamList } from '@/types/navigation';
import { GeneratedImage } from '@/types/Profile';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useImage } from '../contexts/ImageContext';

// API endpoint for your Lambda function
const API_URL = API_ENDPOINTS.GENERATE_IMAGE;

const { width: screenWidth } = Dimensions.get('window');
const BANNER_ASPECT_RATIO = 2.5; // Adjust this value based on your banner's actual aspect ratio


// Define the navigation prop type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function GenerateScreen() {
  const params = useLocalSearchParams<{
    publicImageUrl?: string;
    productId?: string;
    variantId?: string;
  }>();
  
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<"original" | "processed" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const inputRef = useRef<TextInput>(null!);
  const { setImageUrl, setPublicImageUrl, publicImageUrl } = useImage();
  const { clearProductData } = useProduct();
  const [imageUrlState, setImageUrlState] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();
  const { isNavigating } = useNavigationState();
  const [isMounted, setIsMounted] = useState(true);

  // Clear product data when starting a new generation
  useEffect(() => {
    clearProductData();
  }, []);

  // Handle params when they change
  useEffect(() => {
    if (params.publicImageUrl) {
      setImageUrlState(params.publicImageUrl);
      setSelectedImage("original");
    }
  }, [params.publicImageUrl]);

  // Use useFocusEffect instead of useEffect for navigation-related effects
  useFocusEffect(
    useCallback(() => {
      // This runs when the screen comes into focus
      setIsMounted(true);
      
      // Cleanup function
      return () => {
        setIsMounted(false);
      };
    }, [])
  );

  // Add cleanup for any subscriptions or async operations
  useEffect(() => {
    let isSubscribed = true;

    // Your existing initialization code here
    
    return () => {
      isSubscribed = false;
      // Clean up any subscriptions, timers, or async operations
    };
  }, []);

  // Add error boundary
  if (!isMounted) {
    return null; // or a loading state
  }

  const handleChangeText = (text: string) => {
    setPrompt(text);
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt for image generation');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Sending request to:', API_URL);
      // Compose the final prompt with your custom text and the user's input
      const finalPrompt = `Create an image of, ${prompt}. This image should have a solid background and focus the subject matter in the center of the image.`;
      console.log('Request payload:', { prompt: finalPrompt });
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Get the response text first
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      if (data && data.image_urls && data.image_urls.length > 0) {
        const imageUrl = data.image_urls[0];
        console.log('Image URL:', imageUrl);
        
        // Download and save the image locally
        const fileName = `generated-image-${Date.now()}.png`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        
        console.log('Downloading to:', fileUri);
        const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
        
        if (downloadResult.status === 200) {
          setGeneratedImage(fileUri);
          Alert.alert('Success', 'Image generated and saved successfully!');
          handleImageGenerated(fileUri, imageUrl);
        } else {
          throw new Error('Failed to download the image');
        }
      } else {
        console.error('Invalid response format:', data);
        throw new Error('No image URL received from the server');
      }
    } catch (error: any) {
      console.error('Error details:', {
        message: error?.message || 'Unknown error',
        response: error?.response?.data || 'No response data',
        status: error?.response?.status || 'No status code'
      });

      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Server error:', {
            data: error.response.data,
            status: error.response.status,
            headers: error.response.headers
          });
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Request setup error:', error.message);
        }
      } else {
        console.error('Non-Axios error:', error);
      }

      Alert.alert(
        'Error',
        `Failed to generate image: ${error?.message || 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageGenerated = async (fileUri: string, publicUrl: string) => {
    setImageUrl(fileUri);
    setPublicImageUrl(publicUrl);

    // Check if user is logged in
    const userId = await SecureStore.getItemAsync('userId');
    if (userId) {
      try {
        // Create a new GeneratedImage object
        const generatedImage: GeneratedImage = {
          id: `img_${Date.now()}`,
          url: publicUrl,
          createdAt: new Date(),
          prompt: prompt // Use the current prompt from state
        };

        // Save to user's profile
        await ProfileService.saveGeneratedImage(userId, generatedImage);
        console.log('Saved generated image to user profile');
      } catch (error) {
        console.error('Error saving generated image to profile:', error);
        // Don't show error to user since this is a background operation
      }
    }
  };
  
  const handleImageSelect = (type: 'original' | 'processed') => {
    setSelectedImage(type);
    const selectedUrl = type === 'original' ? generatedImage : processedImage;
    if (selectedUrl) {
      handleImageGenerated(selectedUrl, selectedUrl);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photo library to upload images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setIsUploading(true);
        const selectedImage = result.assets[0];
        
        // Save the image locally
        const fileName = `uploaded-image-${Date.now()}.png`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        
        // Copy the selected image to our app's directory
        await FileSystem.copyAsync({
          from: selectedImage.uri,
          to: fileUri
        });

        // Upload to server using the new endpoint
        const formData = new FormData();
        formData.append('image', {
          uri: fileUri,
          type: 'image/png',
          name: fileName
        } as any);

        const response = await fetch(API_ENDPOINTS.UPLOAD_IMAGE, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.image_urls && data.image_urls.length > 0) {
          const imageUrl = data.image_urls[0];
          setGeneratedImage(fileUri);
          setPublicImageUrl(imageUrl);
          
          // Check if user is logged in
          const userId = await SecureStore.getItemAsync('userId');
          if (userId) {
            try {
              const uploadedImage: GeneratedImage = {
                id: `img_${Date.now()}`,
                url: imageUrl,
                createdAt: new Date(),
                prompt: 'Uploaded Image'
              };

              await ProfileService.saveUserImage(userId, uploadedImage);
              console.log('Saved uploaded image to user profile');
            } catch (error) {
              console.error('Error saving uploaded image to profile:', error);
            }
          }

          // Instead of navigating directly, just set the image and let the renderGeneratedImage function handle the UI
          setSelectedImage('original');
        } else {
          throw new Error('No image URL received from the server');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleContinueToProducts = () => {
    navigation.navigate('products', {
      publicImageUrl: publicImageUrl || undefined,
      productId: params.productId,
      variantId: params.variantId,
    });
  };

  const handleEditImage = () => {
    if (generatedImage) {
      navigation.navigate('edit', {
        imageUrl: generatedImage,
        publicImageUrl: publicImageUrl || undefined,
        prompt: prompt
      });
    }
  };

  const renderGeneratedImage = () => {
    if (!generatedImage) return null;
    
    return (
      <ThemedView style={styles.imageContainer}>
        <ThemedText type="subtitle" style={[styles.resultTitle, { color: colors.accent3 }]}>
          Your Image
        </ThemedText>
        <TouchableOpacity 
          onPress={() => handleImageSelect('original')}
          style={[
            styles.imageWrapper,
            selectedImage === 'original' && styles.selectedImage
          ]}
        >
          <ExpoImage
            source={{ uri: generatedImage }}
            style={styles.generatedImage}
            contentFit="contain"
          />
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: colors.accent2 }]}
            onPress={handleEditImage}
            disabled={isLoading}
          >
            <ThemedText style={styles.buttonText}>
              {isLoading ? 'Processing...' : 'Edit Image'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.continueButton, { backgroundColor: colors.accent3 }]}
            onPress={handleContinueToProducts}
          >
            <ThemedText style={styles.buttonText}>Continue to Products</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  };

  if (isNavigating) {
    return null; // or a loading state
  }

  return (
    <ThemedView style={styles.screenContainer}>
      <FlatList
        data={generatedImage ? [1] : []}
        renderItem={renderGeneratedImage}
        keyExtractor={() => 'generated-image'}
        ListHeaderComponent={
          <View>
            <GenerateScreenHeader
              prompt={prompt}
              handleChangeText={handleChangeText}
              inputRef={inputRef}
              isLoading={isLoading}
              generateImage={generateImage}
              colorScheme={colorScheme}
              colors={colors}
            />
            <TouchableOpacity 
              style={[
                styles.uploadButton, 
                { backgroundColor: colors.accent2 }
              ]}
              onPress={pickImage}
              disabled={isLoading || isUploading}
            >
              <ThemedText style={styles.buttonText}>
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#070720',
    paddingBottom: 76,
    paddingTop: 24,
  },
  listContent: {
    flexGrow: 1,
  },
  imageContainer: {
    marginTop: 24,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#070720',
  },
  resultTitle: {
    marginBottom: 16,
    fontSize: 20,
    fontWeight: 'bold',
  },
  generatedImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#360e42',
  },
  imageWrapper: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedImage: {
    borderColor: '#007AFF',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
    marginBottom: 76,
  },
  editButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadButton: {
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
  },
});