import { useNavigationState } from '@/app/contexts/NavigationContext';
import { useProduct } from '@/app/contexts/ProductContext';
import blueprintsData from '@/assets/res/blueprints.json';
import ProductCard from '@/components/ProductCard';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { RootStackParamList } from '@/types/navigation';
import type { Product, ProductVariant } from '@/types/Product';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
// Add type assertion for the imported JSON
const typedBlueprintsData = blueprintsData as BlueprintData;

// Blueprint IDs in the specified order
const BLUEPRINT_IDS = [145, 9, 81, 1634, 1528, 1688, 618, 1498, 74, 1048, 282, 937];
const PRODUCT_PRICES = [19.99, 24.99, 19.99, 24.99, 49.99, 44.99, 14.99, 49.99, 14.99, 19.99, 14.99, 24.99];

// Define the type for the JSON structure
interface BlueprintData {
  blueprints: BlueprintProduct[];
}

// Define the type that matches our JSON structure
interface BlueprintProduct {
  id: number;
  title: string;
  description: string;
  brand: string;
  variants: BlueprintVariant[];
  images: string[];
  print_provider: {
    id: number;
    title: string;
    location: {
      address1: string;
      address2: string;
      city: string;
      country: string;
      region: string;
      zip: string;
    };
  };
  print_areas?: any;
}

interface BlueprintVariant {
  id: string;
  variantId: number;
  title: string;
  options: {
    size: string | string[];
    color?: string | string[];
    depth?: string | string[];
    paper?: string | string[];
    scent?: string | string[];
    [key: string]: string | string[] | undefined;
  };
  placeholders: {
    position: string;
    width: number;
    height: number;
  }[];
  printProviderId: number;
}

// First, let's create a type for processed product data
interface ProcessedProduct extends Product {
  processedVariants: {
    id: string;
    variantId: number;
    style: string;
    size: string;
    color?: string;
    position: string;
    printProviderId: number;
  }[];
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProductsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ imageUrl: string }>();
  const [products, setProducts] = useState<ProcessedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { setSelectedProduct: setProductContextProduct } = useProduct();
  const navigation = useNavigation<NavigationProp>();
  const navigationState = useNavigationState();

  const processProductData = (product: Product): ProcessedProduct => {
    const processedVariants = product.variants.map(variant => {
      // Create a unique identifier for each variant
      const uniqueId = `${product.id}-${variant.id}`;
      
      // Ensure we have arrays for options
      const sizeArray = Array.isArray(variant.options.size) ? variant.options.size : [variant.options.size];
      const colorArray = variant.options.color ? 
        (Array.isArray(variant.options.color) ? variant.options.color : [variant.options.color]) : 
        [];
      
      return {
        id: uniqueId,
        variantId: variant.variantId,
        style: sizeArray[0] || variant.title,
        size: sizeArray[0] || variant.title,
        color: colorArray[0],
        position: variant.placeholders[0]?.position || 'front',
        printProviderId: variant.printProviderId
      };
    });

    return {
      ...product,
      processedVariants
    };
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('Blueprints data:', blueprintsData); // Debug log
      
      // Access the blueprints array from the JSON structure
      const { blueprints } = typedBlueprintsData;
      
      if (!blueprints || !Array.isArray(blueprints)) {
        console.error('Invalid blueprints data structure:', blueprintsData);
        return;
      }
      
      const filteredProducts = blueprints
        .filter(product => BLUEPRINT_IDS.includes(product.id))
        .map((product) => {
          // Transform the blueprint product to match the Product type
          return {
            id: product.id,
            title: product.title,
            description: product.description,
            brand: product.brand,
            price: PRODUCT_PRICES[BLUEPRINT_IDS.indexOf(product.id)] || 0,
            variants: product.variants.map(variant => {
              // Create options object with all properties
              const options: any = {
                size: Array.isArray(variant.options.size) ? variant.options.size : [variant.options.size]
              };
              
              // Add color if it exists
              if (variant.options.color) {
                options.color = Array.isArray(variant.options.color) 
                  ? variant.options.color 
                  : [variant.options.color];
              }
              
              // Add scent if it exists (for candles - ID 1048)
              if (variant.options.scent) {
                options.scent = Array.isArray(variant.options.scent) 
                  ? variant.options.scent 
                  : [variant.options.scent];
              }
              
              // Add depth if it exists
              if (variant.options.depth) {
                options.depth = Array.isArray(variant.options.depth) 
                  ? variant.options.depth 
                  : [variant.options.depth];
              }
              
              return {
                id: variant.id,
                variantId: variant.variantId,
                title: variant.title,
                price: PRODUCT_PRICES[BLUEPRINT_IDS.indexOf(product.id)] || 0,
                options: options,
                placeholders: variant.placeholders,
                printProviderId: variant.printProviderId
              };
            }),
            images: product.images,
            print_provider: product.print_provider,
            print_areas: {}
          };
        });
      
      console.log('Filtered products:', filteredProducts); // Debug log
      setProducts(filteredProducts.map(processProductData));
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleProductSelect = (product: Product, variant?: ProductVariant) => {
    setSelectedProduct(product);
    setSelectedVariant(variant || null);
    setCurrentImageIndex(0);
    setProductContextProduct(product);
  };

  const handleNavigate = (screen: keyof RootStackParamList, params: any) => {
    navigation.navigate(screen, params);
  };

  const handleEditImage = () => {
    handleNavigate('edit', {
      imageUrl: params.imageUrl,
      publicImageUrl: navigationState.screenParams.publicImageUrl,
      prompt: navigationState.screenParams.prompt
    });
  };

  const handleGenerate = () => {
    handleNavigate('generate', {
      productId: selectedProduct?.id,
      variantId: selectedVariant?.id
    });
  };

  const handleViewProfile = () => {
    handleNavigate('profile_data', {
      userId: 'user123' // Replace with actual user ID
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Products</Text>
      <ScrollView style={styles.scrollView}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onSelect={(product, variant) => {
              handleProductSelect(product, variant);
              if (variant) {
                handleEditImage();
              }
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070720',
    marginBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#22c2e5',
    paddingTop: 48,
  },
  scrollView: {
    flex: 1,
    padding: 10,
  }
});