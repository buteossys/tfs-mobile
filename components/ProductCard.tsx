import { useImage } from '@/app/contexts/ImageContext';
import type { RootStackParamList } from '@/types/navigation';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProduct } from '@/app/contexts/ProductContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Product, ProductVariant } from '@/types/Product';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UserSelection {
  variantId: string;
  size: string;
  color: string;
  depth: string;
  scent: string;
  position: string;
}

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product, variant?: ProductVariant) => void;
}

// Helper function to parse variants
const parseVariants = (variants: ProductVariant[]) => {
  console.log('=== Starting parseVariants ===');
  
  const stylesMap: { [key: string]: { sizes: string[], variantId: number } } = {};
  
  variants.forEach(variant => {
    // Check if variant.options exists
    if (!variant.options) {
      console.log('Skipping variant with missing options:', variant);
      return;
    }
    
    // Use the variant ID as the style key for uniqueness
    const style = variant.id;
    
    if (!stylesMap[style]) {
      // Get the primary option (size, depth, etc.)
      const primaryOption = getPrimaryOptionValue(variant.options);
      
      stylesMap[style] = {
        sizes: [primaryOption],
        variantId: variant.variantId
      };
    }
  });
  
  console.log('Final stylesMap:', JSON.stringify(stylesMap, null, 2));
  return stylesMap;
};

// Helper function to get the primary option value
const getPrimaryOptionValue = (options: any): string => {
  // Priority order: size, depth, paper, etc.
  if (options.size) {
    return Array.isArray(options.size) ? options.size[0] : options.size;
  }
  if (options.depth) {
    return Array.isArray(options.depth) ? options.depth[0] : options.depth;
  }
  if (options.paper) {
    return Array.isArray(options.paper) ? options.paper[0] : options.paper;
  }
  
  // If none of the above, return the first option value
  const firstKey = Object.keys(options)[0];
  if (firstKey) {
    const value = options[firstKey];
    return Array.isArray(value) ? value[0] : value;
  }
  
  return '';
};

// Helper function to get the secondary option value
const getSecondaryOptionValue = (options: any): string => {
  // Priority order: color, depth (if size exists), etc.
  if (options.color) {
    return Array.isArray(options.color) ? options.color[0] : options.color;
  }
  if (options.size && options.depth) {
    return Array.isArray(options.depth) ? options.depth[0] : options.depth;
  }
  
  // If none of the above, return empty string
  return '';
};

// Helper function to get display name for a variant
const getVariantDisplayName = (variant: ProductVariant): string => {
  const primaryOption = getPrimaryOptionValue(variant.options);
  const secondaryOption = getSecondaryOptionValue(variant.options);
  
  if (secondaryOption) {
    return `${primaryOption} / ${secondaryOption}`;
  }
  
  return primaryOption || variant.title;
};

const ProductCard = ({ product, onSelect }: ProductCardProps) => {
  // Add null checks
  if (!product || !product.variants) {
    console.log('Product or variants is undefined:', { product });
    return null;
  }

  const router = useRouter();
  const { setSelectedProduct } = useProduct();
  const params = useLocalSearchParams<{ imageUrl: string; publicImageUrl: string }>();
  const { imageUrl, publicImageUrl, setImageUrl, setPublicImageUrl } = useImage();
  const navigation = useNavigation<NavigationProp>();
  
  // Initialize image context from params if available
  useEffect(() => {
    if (params.imageUrl && !imageUrl) {
      setImageUrl(params.imageUrl);
    }
    if (params.publicImageUrl && !publicImageUrl) {
      setPublicImageUrl(params.publicImageUrl);
    }
  }, [params.imageUrl, params.publicImageUrl]);

  // Add logging to debug image URLs
  useEffect(() => {
    console.log('ProductCard - Image URLs:', {
      imageUrl,
      publicImageUrl,
      params
    });
  }, [imageUrl, publicImageUrl, params]);
  
  const [userSelection, setUserSelection] = useState<UserSelection>({
    variantId: '',
    size: '',
    color: '',
    depth: '',
    scent: '',
    position: ''
  });
  
  // Track selected style and size separately
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showSelection, setShowSelection] = useState(false);
  const stylesMap = useMemo(() => parseVariants(product.variants), [product.variants]);
  const availableStyles = Object.keys(stylesMap);
  
  // Determine if this is the candle product (ID 1048)
  const isCandle = product.id === 1048;
  
  // Extract unique style options (colors or scents)
  const styleOptions = useMemo(() => {
    const uniqueStyles = new Set();
    const result: { id: string; displayName: string }[] = [];
    
    // For candles, extract scent options
    if (isCandle) {
      product.variants.forEach(v => {
        // Try to access scent from options
        const options = v.options as any;
        if (options && options.scent) {
          const scentValue = Array.isArray(options.scent) ? options.scent[0] : options.scent;
          if (scentValue && !uniqueStyles.has(scentValue)) {
            uniqueStyles.add(scentValue);
            result.push({ id: scentValue, displayName: scentValue });
          }
        }
      });
      
      if (result.length > 0) {
        return result;
      }
    }
    
    // For other products, extract color or other style options
    product.variants.forEach(v => {
      let style = '';
      if (v.options.color) {
        style = Array.isArray(v.options.color) ? v.options.color[0] : v.options.color;
      } else if (v.options.depth) {
        style = Array.isArray(v.options.depth) ? v.options.depth[0] : v.options.depth;
      } else {
        // Find first option that's not size
        const optionKeys = Object.keys(v.options).filter(key => key !== 'size');
        if (optionKeys.length > 0) {
          const value = v.options[optionKeys[0]];
          style = Array.isArray(value) ? (value.length > 0 ? value[0] : '') : 
          value || '';
        }
      }
      
      if (style && !uniqueStyles.has(style)) {
        uniqueStyles.add(style);
        result.push({ id: style, displayName: style });
      }
    });
    
    return result;
  }, [product.variants, isCandle]);
  
  // Extract unique size options
  const sizeOptions = useMemo(() => {
    const uniqueSizes = new Set();
    const result: { id: string; displayName: string }[] = [];
    
    product.variants.forEach(v => {
      if (v.options.size) {
        const size = Array.isArray(v.options.size) ? v.options.size[0] : v.options.size;
        if (size && !uniqueSizes.has(size)) {
          uniqueSizes.add(size);
          result.push({ id: size, displayName: size });
        }
      }
    });
    
    return result;
  }, [product.variants]);
  
  const availablePositions = useMemo(() => 
    Array.from(new Set(product.variants.flatMap(v => v.placeholders.map(p => p.position)))),
    [product.variants]
  );
  
  // Add safety check for initial style and size selection
  useEffect(() => {
    if (styleOptions.length > 0 && !selectedStyle) {
      setSelectedStyle(styleOptions[0].id);
    }
    
    if (sizeOptions.length > 0 && !selectedSize) {
      setSelectedSize(sizeOptions[0].id);
    }
  }, [styleOptions, sizeOptions]);
  
  // Find matching variant when style or size changes
  useEffect(() => {
    if (selectedStyle && selectedSize) {
      // Find the variant that matches both style/scent and size
      const matchingVariant = product.variants.find(v => {
        // For candles, use scent instead of color/style
        let variantStyle;
        if (isCandle) {
          const options = v.options as any;
          variantStyle = options.scent;
        } else {
          variantStyle = v.options.color || 
                       (v.options.depth && v.options.size ? v.options.depth : '');
        }
        
        const variantSize = v.options.size;
        
        const styleMatch = Array.isArray(variantStyle) 
          ? variantStyle.includes(selectedStyle) 
          : variantStyle === selectedStyle;
          
        const sizeMatch = Array.isArray(variantSize) 
          ? variantSize.includes(selectedSize) 
          : variantSize === selectedSize;
          
        return styleMatch && sizeMatch;
      });
      
      if (matchingVariant) {
        setUserSelection(prev => ({
          ...prev,
          variantId: matchingVariant.id
        }));
      }
    }
  }, [selectedStyle, selectedSize, product.variants, isCandle]);

  // Add safety check for position selection
  useEffect(() => {
    if (userSelection.variantId) {
      const variant = product.variants.find(v => v.id === userSelection.variantId);
      if (variant && variant.placeholders.length > 0 && !userSelection.position) {
        setUserSelection(prev => ({
          ...prev,
          position: variant.placeholders[0].position
        }));
      }
    }
  }, [userSelection.variantId, product.variants]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left' && currentImageIndex < product.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else if (direction === 'right' && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleSelect = () => {
    const missingSelections = [];
    
    // Check for publicImageUrl instead of imageUrl
    if (!publicImageUrl) missingSelections.push('image');
    if (!selectedStyle) missingSelections.push(isCandle ? 'scent' : 'style');
    if (!selectedSize) missingSelections.push('size');
    if (!userSelection.position) missingSelections.push('position');

    if (missingSelections.length > 0) {
      console.log('Missing selections:', missingSelections);
      alert(`Please select: ${missingSelections.join(', ')}`);
      return;
    }

    // Find the variant that matches both style/scent and size
    const selectedVariant = product.variants.find(v => {
      // For candles, use scent instead of color/style
      let variantStyle;
      if (isCandle) {
        const options = v.options as any;
        variantStyle = options.scent;
      } else {
        variantStyle = v.options.color || 
                     (v.options.depth && v.options.size ? v.options.depth : '');
      }
      
      const variantSize = v.options.size;
      
      const styleMatch = Array.isArray(variantStyle) 
        ? variantStyle.includes(selectedStyle) 
        : variantStyle === selectedStyle;
        
      const sizeMatch = Array.isArray(variantSize) 
        ? variantSize.includes(selectedSize) 
        : variantSize === selectedSize;
        
      return styleMatch && sizeMatch;
    });
    
    if (!selectedVariant) {
      console.error('No variant found matching style and size:', { selectedStyle, selectedSize });
      alert('No product variant matches your selection. Please try a different combination.');
      return;
    }

    // Find the placeholder object for the selected position
    const selectedPlaceholder = selectedVariant.placeholders.find(
      (ph) => ph.position === userSelection.position
    );

    // Get the height (default to 0 if not found)
    const variantSize = selectedPlaceholder ? selectedPlaceholder.height : 0;

    // Set the selected product in context before navigation
    setSelectedProduct({
      ...product,
      selectedVariant: selectedVariant,
      selectedSize: userSelection.size,
      selectedPosition: userSelection.position,
      variantSize: variantSize
    });

    // Navigate to mockup screen
    navigation.navigate('mockup', {
      productId: product.id.toString(),
      variantId: selectedVariant.variantId.toString(),
      printProviderId: selectedVariant.printProviderId.toString(),
      publicImageUrl: publicImageUrl || undefined,
      placeholders: userSelection.position,
      variantSize: variantSize.toString(),
      productPrice: product.price.toFixed(2),
    });
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.background }]}>
      <View style={styles.imageContainer}>
        {product.images && product.images.length > 0 ? (
          <Image
            source={{ uri: product.images[currentImageIndex] }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.image, styles.placeholderImage, { backgroundColor: colors.background }]}>
            <Text style={{ color: colors.text }}>No image available</Text>
          </View>
        )}
        
        {/* Add swipe indicators */}
        {product.images && product.images.length > 1 && (
          <View style={styles.swipeIndicators}>
            <TouchableOpacity 
              style={[styles.swipeButton, { backgroundColor: colors.tint }]}
              onPress={() => handleSwipe('right')}
              disabled={currentImageIndex === 0}
            >
              <Text style={[styles.swipeButtonText, { color: colors.background }]}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.swipeButton, { backgroundColor: colors.tint }]}
              onPress={() => handleSwipe('left')}
              disabled={currentImageIndex === product.images.length - 1}
            >
              <Text style={[styles.swipeButtonText, { color: colors.background }]}>→</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.details}>
        <Text style={[styles.title, { color: colors.text }]}>{product.title}</Text>
        <Text style={[styles.brand, { color: colors.text }]}>{product.brand}</Text>
        <Text style={[styles.price, { color: colors.accent2 || '#22c2e5' }]}>
          Starting At: ${product.price.toFixed(2)}
        </Text>
        
        <TouchableOpacity
          style={[styles.selectOptionsButton, { backgroundColor: colors.tint }]}
          onPress={() => setShowSelection(!showSelection)}
        >
          <Text style={[styles.selectOptionsButtonText, { color: colors.background }]}>
            {showSelection ? 'Hide Options' : 'Select Options'}
          </Text>
        </TouchableOpacity>

        {showSelection && product.variants && product.variants.length > 0 && (
          <View style={[styles.selectionContainer, { backgroundColor: colors.background }]}>
            {/* Style/Scent Selection */}
            {styleOptions.length > 0 && (
              <>
                <Text style={[styles.selectionTitle, { color: colors.text }]}>
                  {isCandle ? 'Select Scent' : 'Select Style'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScrollView}>
                  {styleOptions.map((style) => (
                    <TouchableOpacity
                      key={style.id}
                      style={[
                        styles.selectionButton,
                        { backgroundColor: colors.background },
                        selectedStyle === style.id && { backgroundColor: colors.tint }
                      ]}
                      onPress={() => {
                        setSelectedStyle(style.id);
                      }}
                    >
                      <Text 
                        style={[
                          styles.selectionButtonText,
                          { color: selectedStyle === style.id ? colors.background : colors.text }
                        ]}
                      >
                        {style.displayName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
            
            {/* Size Selection */}
            {sizeOptions.length > 0 && (
              <>
                <Text style={[styles.selectionTitle, { color: colors.text, marginTop: 16 }]}>
                  Select Size
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScrollView}>
                  {sizeOptions.map((size) => (
                    <TouchableOpacity
                      key={size.id}
                      style={[
                        styles.selectionButton,
                        { backgroundColor: colors.background },
                        selectedSize === size.id && { backgroundColor: colors.tint }
                      ]}
                      onPress={() => {
                        setSelectedSize(size.id);
                      }}
                    >
                      <Text 
                        style={[
                          styles.selectionButtonText,
                          { color: selectedSize === size.id ? colors.background : colors.text }
                        ]}
                      >
                        {size.displayName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Position Selection */}
            {availablePositions.length > 0 && (
              <>
                <Text style={[styles.selectionTitle, { color: colors.text, marginTop: 16 }]}>
                  Select Position
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScrollView}>
                  {availablePositions.map((position) => (
                    <TouchableOpacity
                      key={position}
                      style={[
                        styles.selectionButton,
                        { backgroundColor: colors.background },
                        userSelection.position === position && { backgroundColor: colors.tint }
                      ]}
                      onPress={() => {
                        setUserSelection(prev => ({
                          ...prev,
                          position: position
                        }));
                      }}
                    >
                      <Text style={[styles.selectionButtonText, { color: userSelection.position === position ? colors.background : colors.text }]}>
                        {position}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        )}

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.selectButton, { backgroundColor: colors.tint }]}
          onPress={handleSelect}
        >
          <Text style={[styles.selectButtonText, { color: colors.background }]}>
            Continue to Preview
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 32; // 16px padding on each side

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 10,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeIndicators: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  swipeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  swipeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  details: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  brand: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.7,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectionContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  optionsScrollView: {
    marginVertical: 8,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    minWidth: 80,
    alignItems: 'center',
  },
  selectionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectOptionsButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectOptionsButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductCard;