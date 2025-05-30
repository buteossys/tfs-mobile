import { API_ENDPOINTS } from '@/app/config';
import { useNavigationState } from '@/app/contexts/NavigationContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { RootStackParamList } from '@/types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import type { Product } from '@/types/Product';

const { width: screenWidth } = Dimensions.get('window');


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CartScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams<{ 
    productId: string, 
    variantId: string, 
    blueprintId: string,
    productPrice: string,
    publicImageUrl: string
  }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const navigation = useNavigation<NavigationProp>();
  const { isNavigating } = useNavigationState();

  const QuantitySelector = ({ 
    quantity, 
    onIncrement, 
    onDecrement, 
    colors 
  }: { 
    quantity: number; 
    onIncrement: () => void; 
    onDecrement: () => void; 
    colors: any;
  }) => (
    <View style={styles.quantityContainer}>
      <TouchableOpacity 
        style={[styles.quantityButton, { backgroundColor: colors.accent2 }]} 
        onPress={onDecrement}
        disabled={quantity <= 1}
      >
        <Ionicons name="remove" size={20} color="#FFFFFF" />
      </TouchableOpacity>
      <ThemedText style={[styles.quantityText, { color: colors.accent3 }]}>
        {quantity}
      </ThemedText>
      <TouchableOpacity 
        style={[styles.quantityButton, { backgroundColor: colors.accent2 }]} 
        onPress={onIncrement}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    const fetchProduct = async (productId: string) => {
      try {
        // Check if API keys are available
        if (!API_ENDPOINTS.PRINTIFY_SHOP_ID || !API_ENDPOINTS.PRINTIFY_API_KEY) {
          console.error('Missing Printify API credentials');
          Alert.alert('Error', 'Configuration error. Please check your API settings.');
          return;
        }
        
        console.log('Fetching product with ID:', productId);
        const response = await fetch(
          `https://api.printify.com/v1/shops/${API_ENDPOINTS.PRINTIFY_SHOP_ID}/products/${productId}.json`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${API_ENDPOINTS.PRINTIFY_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched product:', data);
        
        // Use the price from params if available, otherwise use the product data
        const productWithPrice = {
          ...data,
          price: params.productPrice ? parseFloat(params.productPrice) : (data.price || 0)
        };
        
        console.log('Product with price:', productWithPrice);
        setProduct(productWithPrice);
        
        // Set the selected variant ID if it's provided in params
        if (params.variantId) {
          const variantIdNum = parseInt(params.variantId);
          setSelectedVariantId(variantIdNum);
          console.log('Selected variant ID:', variantIdNum);
          
          // Fetch shipping costs for this variant
          fetchShippingCost(data.print_provider_id, variantIdNum);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        Alert.alert('Error', 'Failed to load product. Please try again.');
      }
    };
    
    const fetchShippingCost = async (printProviderId: number, variantId: number) => {
      try {
        const blueprintId = parseInt(params.blueprintId);
        console.log('Debug params:', {
          productId: params.productId,
          parsedBlueprintId: blueprintId,
          printProviderId,
          variantId
        });
    
        if (!blueprintId) {
          console.error('Blueprint ID not available');
          return;
        }
    
        if (!printProviderId || !variantId) {
          console.error('Missing required IDs:', { printProviderId, variantId });
          return;
        }
    
        const url = `https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/shipping.json`;
        console.log('Fetching from URL:', url);
    
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${API_ENDPOINTS.PRINTIFY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
    
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }
    
        const data = await response.json();
        console.log('Raw shipping data:', JSON.stringify(data, null, 2));
    
        let shippingCost = 0;
        if (data && data.profiles) {
          console.log('Available profiles:', data.profiles.map((p: any) => ({
            variant_ids: p.variant_ids,
            countries: p.countries,
            first_item: p.first_item
          })));
          
          for (const profile of data.profiles) {
            if (profile.variant_ids.includes(variantId) && profile.countries.includes('US')) {
              if (profile.first_item && profile.first_item.currency === 'USD') {
                shippingCost = profile.first_item.cost / 100;
                console.log('Found matching profile:', profile);
                break;
              }
            }
          }
        }
    
        console.log('Final shipping cost:', shippingCost);
        setShippingCost(shippingCost);
      } catch (error) {
        console.error('Detailed error in fetchShippingCost:', error);
        setShippingCost(0);
        Alert.alert('Warning', 'Unable to fetch shipping costs. Please try again later.');
      }
    };
    
    
    

    if (params.productId) {
      console.log('Fetching product with ID:', params.productId);
      fetchProduct(params.productId);
    } else {
      console.log('No productId provided in params');
    }
  }, [params.productId, params.variantId]);

  const handleCheckout = () => {
    if (!product) {
      console.error('No product available');
      return;
    }

    if (!selectedVariantId) {
      console.error('No variant ID available');
      Alert.alert('Error', 'Product variant information is not available');
      return;
    }

    const itemPrice = product.price;
    const totalPrice = (itemPrice * quantity) + shippingCost;
      
    console.log('Proceeding to checkout with:', {
      productId: product.id,
      variantId: selectedVariantId,
      itemPrice,
      shippingCost,
      totalPrice,
      quantity
    });

    navigation.navigate('payment', {
      productId: product.id.toString(),
      variantId: selectedVariantId.toString(),
      itemPrice: (itemPrice * quantity).toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      total: totalPrice.toFixed(2),
      quantity: quantity.toString(),
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  console.log('product in render:', product);

  if (!product) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.primary }]}>
        <ThemedText type="subtitle" style={[styles.title, { color: colors.accent3 }]}>
          Your Cart
        </ThemedText>
        <ThemedText>Loading product...</ThemedText>
      </ThemedView>
    );
  }

  // Find the selected variant or use the first one as fallback
  const variant = selectedVariantId 
    ? product.variants.find(v => Number(v.id) === selectedVariantId) || product.variants[0]
    : product.variants[0];
    
  const price = product.price ? product.price.toFixed(2) : 'N/A';
  const frontImage = product.images?.[0];
  const productTitle = product.title;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.primary }]}>
      <ThemedText type="subtitle" style={[styles.title, { color: colors.accent3 }]}>
        Your Cart
      </ThemedText>
      <View style={styles.cartItems}>
        <View style={[styles.cartItem, { backgroundColor: colors.secondary }]}>
          {frontImage ? (
            <Image
              source={{ uri: frontImage }}
              style={styles.itemImage}
              contentFit="contain"
            />
          ) : (
            <View style={[styles.itemImage, { backgroundColor: colors.background }]} />
          )}
          <View style={styles.itemDetails}>
            <ThemedText type="defaultSemiBold" style={[styles.itemName, { color: colors.accent3 }]}>
              {productTitle || 'Product'}
            </ThemedText>
            <ThemedText style={[styles.itemInfo, { color: colors.accent3 }]}>
              {variant?.title || 'Standard'}
            </ThemedText>
            <ThemedText style={[styles.itemPrice, { color: colors.accent2 }]}>
              ${price}
            </ThemedText>
            <QuantitySelector
              quantity={quantity}
              onIncrement={() => setQuantity(prev => prev + 1)}
              onDecrement={() => setQuantity(prev => Math.max(1, prev - 1))}
              colors={colors}
            />
          </View>
        </View>
      </View>
      <View style={[styles.summary, { backgroundColor: colors.secondary }]}>
        <View style={styles.summaryRow}>
          <ThemedText style={[styles.summaryText, { color: colors.accent3 }]}>Subtotal</ThemedText>
          <ThemedText style={[styles.summaryText, { color: colors.accent3 }]}>
            ${(parseFloat(price) * quantity).toFixed(2)}
          </ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText style={[styles.summaryText, { color: colors.accent3 }]}>Shipping</ThemedText>
          <ThemedText style={[styles.summaryText, { color: colors.accent3 }]}>
            ${shippingCost.toFixed(2)}
          </ThemedText>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <ThemedText type="defaultSemiBold" style={[styles.totalText, { color: colors.accent2 }]}>Total</ThemedText>
          <ThemedText type="defaultSemiBold" style={[styles.totalText, { color: colors.accent2 }]}>
            ${(parseFloat(price) * quantity + shippingCost).toFixed(2)}
          </ThemedText>
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.checkoutButton, { backgroundColor: colors.accent2 }]}
        onPress={handleCheckout}>
        <ThemedText style={styles.checkoutButtonText}>Proceed to Checkout</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: colors.accent3 }]}
        onPress={handleBack}
      >
        <ThemedText style={styles.buttonText}>Back</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 48,
    paddingBottom: 125
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  cartItems: {
    flex: 1,
    gap: 16,
  },
  cartItem: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    padding: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    marginBottom: 4,
  },
  itemInfo: {
    fontSize: 14,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  summary: {
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryText: {
    fontSize: 14,
  },
  totalText: {
    fontSize: 16,
  },
  checkoutButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
});