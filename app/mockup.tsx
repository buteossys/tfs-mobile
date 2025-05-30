import { API_ENDPOINTS } from '@/app/config';
import { useProduct } from '@/app/contexts/ProductContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ProfileService } from '@/services/ProfileService';
import { Design } from '@/types/Profile';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

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
  },
  mockupContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  mockupImage: {
    width: screenWidth - 32,
    height: screenWidth - 32,
  },
  optionsContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  optionSection: {
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionButtonText: {
    fontSize: 14,
  },
  addToCartButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  addToCartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  swipeButton: {
    padding: 8,
    borderRadius: 20,
    opacity: 0.8,
  },
  swipeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

interface PrintifyImage {
  src: string;
  variant_ids: number[];
  position: string;
  width: number;
  height: number;
}

interface PrintifyProductDetails {
  id: string;
  title: string;
  description: string;
  tags: string[];
  options: Array<{
    name: string;
    type: string;
    values: string[];
  }>;
  variants: Array<{
    id: number;
    title: string;
    options: {
      [key: string]: string;
    };
    placeholders: Array<{
      position: string;
      height: number;
      width: number;
    }>;
  }>;
  images: PrintifyImage[];
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  blueprint_id: number;
  print_provider_id: number;
  user_id: string;
  shop_id: string;
  print_areas: {
    [key: string]: {
      x_ratio: number;
      y_ratio: number;
      width_ratio: number;
      height_ratio: number;
    };
  };
  sales_channel_properties: Array<{
    sales_channel_id: string;
    properties: {
      [key: string]: any;
    };
  }>;
  status: 'draft' | 'pending' | 'published' | 'failed';
}

export default function MockupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    productId: string;
    variantId: string;
    publicImageUrl: string;
    placeholders: string;
    printProviderId: string;
    variantSize: string;
    productPrice: string;
  }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { selectedProduct, selectedImage, setSelectedImage } = useProduct();
  const [mockupImage, setMockupImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [parsedBody, setParsedBody] = useState<{product_id?: string, images?: string[]} | null>(null);

  useEffect(() => {
    if (!selectedProduct) {
      router.replace('/products');
    }
  }, [selectedProduct]);

  useEffect(() => {
    console.log('Mockup params:', {
      publicImageUrl: params.publicImageUrl,
      productId: params.productId,
      variantId: params.variantId
    });
    
    if (params.publicImageUrl && params.productId && params.variantId) {
      console.log('Calling createPrintifyProduct');
      createPrintifyProduct();
    } else {
      console.log('Missing required params:', {
        hasPublicImageUrl: !!params.publicImageUrl,
        hasProductId: !!params.productId,
        hasVariantId: !!params.variantId
      });
    }
  }, [params.publicImageUrl, params.productId, params.variantId]);

  useEffect(() => {
    console.log('Product images updated:', {
      productImages,
      currentImageIndex,
      mockupImage
    });
  }, [productImages, currentImageIndex, mockupImage]);

  const createPrintifyProduct = async () => {
    if (!params.publicImageUrl || !params.productId || !params.variantId) {
      console.error('Missing required parameters');
      return;
    }

    // Add region to S3 URL if it's missing
    const imageUrl = params.publicImageUrl.replace(
      's3.amazonaws.com',
      's3.us-east-2.amazonaws.com'
    );
    const fileName = imageUrl.split('/').pop();
    setLoading(true);
    try {
      // First, upload the image to Printify's media library
      const uploadResponse = await fetch('https://api.printify.com/v1/uploads/images.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_ENDPOINTS.PRINTIFY_API_KEY}`
        },
        body: JSON.stringify({
          file_name: fileName,
          url: imageUrl
        }),
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.text();
        console.error('Printify upload failed:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          error: errorData
        });
        throw new Error('Failed to upload image to Printify');
      }

      const uploadData = await uploadResponse.json();
      const printifyImageId = uploadData.id;
      console.log('Using Printify image ID:', printifyImageId);

      // Then create the product with the Printify image ID
      const response = await fetch(API_ENDPOINTS.CREATE_PRODUCT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Custom Product ${params.productId}`,
          description: 'Custom designed product',
          safety_information: 'GPSR information: John Doe, test@example.com, 123 Main St, Apt 1, New York, NY, 10001, US\nProduct information: Gildan, 5000, 2 year warranty in EU and UK as per Directive 1999/44/EC\nWarnings, Hazzard: No warranty, US\nCare instructions: Machine wash: warm (max 40C or 105F), Non-chlorine: bleach as needed, Tumble dry: medium, Do not iron, Do not dryclean',
          blueprint_id: parseInt(params.productId),
          print_provider_id: parseInt(params.printProviderId),
          variants: [
            {
              id: parseInt(params.variantId),
              price: 1999,
              is_enabled: true
            }
          ],
          print_areas: [
            {
              variant_ids: [parseInt(params.variantId)],
              placeholders: [
                {
                  position: params.placeholders || 'front',
                  images: [
                    {
                      id: printifyImageId,
                      x: 0.5,
                      y: 0.5,
                      scale: 1,
                      angle: 0
                    }
                  ]
                }
              ]
            }
          ],
          imageUrl: imageUrl,
          variantSize: params.variantSize,
          productPrice: 1999
        }),
      });

      const productResponse = await response.json();
      console.log('Product response:', productResponse);

      // Handle the simplified response structure
      if (productResponse.product_id && productResponse.images) {
        // Log the raw images array to see what we're getting
        console.log('Raw images array:', productResponse.images);
        
        // Extract all image URLs, ensuring we're getting the src property
        const images = productResponse.images.map((img: any) => {
          console.log('Processing image:', img);
          return img.src;
        }).filter(Boolean); // Filter out any undefined/null values
        
        console.log('Processed images array:', images);
        
        if (images.length > 0) {
          console.log('Setting product images:', images);
          setProductImages(images);
          setMockupImage(images[0]);
          setParsedBody({
            product_id: productResponse.product_id,
            images: images
          });
          
          // Check if user is logged in and save design to profile
          const userId = await SecureStore.getItemAsync('userId');
          if (userId) {
            try {
              const design: Design = {
                id: `design_${Date.now()}`,
                productId: parseInt(params.productId),
                variantId: parseInt(params.variantId),
                imageUrl: imageUrl,
                createdAt: new Date(),
                name: `Custom Product ${params.productId}`
              };

              await ProfileService.saveDesign(userId, design);
              console.log('Saved design to user profile');
            } catch (error) {
              console.error('Error saving design to profile:', error);
            }
          }
        } else {
          console.error('No valid images found in response');
          throw new Error('No valid images received from Printify');
        }
      } else {
        throw new Error('Invalid response format from Printify');
      }
    } catch (error) {
      console.error('Error creating/fetching product:', error);
      Alert.alert('Error', 'Failed to create or fetch product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    console.log('Swipe called:', {
      direction,
      currentIndex: currentImageIndex,
      totalImages: productImages.length,
      images: productImages
    });
    
    if (direction === 'left' && currentImageIndex < productImages.length - 1) {
      const newIndex = currentImageIndex + 1;
      console.log('Swiping left to index:', newIndex);
      setCurrentImageIndex(newIndex);
      setMockupImage(productImages[newIndex]);
    } else if (direction === 'right' && currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1;
      console.log('Swiping right to index:', newIndex);
      setCurrentImageIndex(currentImageIndex - 1);
      setMockupImage(productImages[newIndex]);
    }
  };

  const handleAddToCart = () => {
    console.log('Add to cart clicked:', {
      mockupImage,
      parsedBody,
      params
    });

    if (!mockupImage) {
      Alert.alert('Error', 'Please wait for the mockup to be generated');
      return;
    }

    // Get the product ID from parsedBody
    const productId = parsedBody?.product_id;
    
    if (!productId) {
      console.error('No product ID available');
      Alert.alert('Error', 'Product information is not available');
      return;
    }

    console.log('Navigating to cart with:', {
      productId,
      variantId: params.variantId,
      blueprintId: params.productId,
      productPrice: params.productPrice
    });

    router.push({
      pathname: '/(tabs)/cart',
      params: {
        productId: productId,
        variantId: params.variantId,
        blueprintId: params.productId,
        productPrice: params.productPrice,
      }
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.primary }]}>
      <ThemedText type="subtitle" style={[styles.title, { color: colors.accent3 }]}>
        The bots are sewing!
      </ThemedText>
      
      {params.productPrice && (
        <ThemedText style={[styles.priceText, { color: colors.accent2 || '#22c2e5' }]}>
          Price: ${params.productPrice}
        </ThemedText>
      )}

      <View style={styles.mockupContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent2} />
        ) : productImages.length > 0 ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: productImages[currentImageIndex] }}
              style={styles.mockupImage}
              contentFit="contain"
            />
            
            {productImages.length > 1 && (
              <View style={styles.swipeIndicators}>
                <TouchableOpacity 
                  style={[
                    styles.swipeButton, 
                    { backgroundColor: colors.tint },
                    currentImageIndex === 0 && { opacity: 0.5 }
                  ]}
                  onPress={() => {
                    console.log('Left swipe button pressed');
                    handleSwipe('right');
                  }}
                  disabled={currentImageIndex === 0}
                >
                  <Text style={[styles.swipeButtonText, { color: colors.background }]}>←</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.swipeButton, 
                    { backgroundColor: colors.tint },
                    currentImageIndex === productImages.length - 1 && { opacity: 0.5 }
                  ]}
                  onPress={() => {
                    console.log('Right swipe button pressed');
                    handleSwipe('left');
                  }}
                  disabled={currentImageIndex === productImages.length - 1}
                >
                  <Text style={[styles.swipeButtonText, { color: colors.background }]}>→</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <ThemedText style={{ color: colors.accent3 }}>
            Generating product...
          </ThemedText>
        )}
      </View>

      <TouchableOpacity 
        style={[
          styles.addToCartButton, 
          { backgroundColor: colors.accent2 },
          (!mockupImage || loading) && { opacity: 0.5 }
        ]}
        onPress={() => {
          console.log('Add to cart button pressed');
          handleAddToCart();
        }}
        disabled={!mockupImage || loading}>
        <ThemedText style={styles.addToCartButtonText}>
          {loading ? 'Generating Mockup...' : 'Add to Cart'}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

 