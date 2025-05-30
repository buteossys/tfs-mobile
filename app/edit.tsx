import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as FileSystem from 'expo-file-system';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, PanResponder, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import ColorPicker from 'react-native-wheel-color-picker';

import { API_ENDPOINTS } from '@/app/config';
import { useImage } from '@/app/contexts/ImageContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ProfileService } from '@/services/ProfileService';
import { GeneratedImage, TextData } from '@/types/Profile';

const { width: screenWidth } = Dimensions.get('window');

// Simple text overlay interface
interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

export default function EditScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { setImageUrl, setPublicImageUrl } = useImage();

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedTextIndex, setSelectedTextIndex] = useState<number | null>(null);
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);

  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Gesture handlers
  const composed = Gesture.Simultaneous(
    Gesture.Pinch().onUpdate((e) => { scale.value = e.scale; }),
    Gesture.Rotation().onUpdate((e) => { rotation.value = e.rotation; }),
    Gesture.Pan().onUpdate((e) => { 
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
  );

  // Helper function to get image URL
  const getImageUrl = () => {
    const url = processedImage || params.imageUrl;
    return Array.isArray(url) ? url[0] : url;
  };

  // Add text handler
  const handleAddText = () => {
    setSelectedTextIndex(null);
    setTextInput('');
    setTextColor('#FFFFFF');
    setFontSize(24);
    setFontFamily('Arial');
    setShowTextInput(true);
  };

  // Save text handler
  const handleSaveText = () => {
    if (!textInput.trim()) return;
    
    if (selectedTextIndex !== null) {
      // Edit existing text
      const updatedOverlays = [...textOverlays];
      updatedOverlays[selectedTextIndex] = {
        ...updatedOverlays[selectedTextIndex],
        text: textInput,
        color: textColor,
        fontSize: fontSize,
        fontFamily: fontFamily
      };
      setTextOverlays(updatedOverlays);
    } else {
      // Add new text
      const newTextOverlay: TextOverlay = {
        id: `text_${Date.now()}`,
        text: textInput,
        x: 50,
        y: 50,
        fontSize: fontSize,
        color: textColor,
        fontFamily: fontFamily
      };
      setTextOverlays([...textOverlays, newTextOverlay]);
    }
    
    setShowTextInput(false);
  };

  // Edit text handler
  const handleEditText = (index: number) => {
    setSelectedTextIndex(index);
    setTextInput(textOverlays[index].text);
    setTextColor(textOverlays[index].color);
    setFontSize(textOverlays[index].fontSize);
    setFontFamily(textOverlays[index].fontFamily);
    setShowTextInput(true);
  };

  // Delete text handler
  const handleDeleteText = (index: number) => {
    const newOverlays = [...textOverlays];
    newOverlays.splice(index, 1);
    setTextOverlays(newOverlays);
  };

  // Handle background removal
  const handleRemoveBackground = async () => {
    if (!params.publicImageUrl) {
      Alert.alert('Error', 'No public image URL available');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.REMOVE_BACKGROUND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: params.publicImageUrl }),
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.job_id) {
        let jobComplete = false;
        let attempts = 0;
        const maxAttempts = 30;
        
        while (!jobComplete && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const statusResponse = await fetch(`${API_ENDPOINTS.JOB_STATUS}/${data.job_id}`);
          const statusData = await statusResponse.json();
          
          if (statusData.status === 'completed' && statusData.processedImageUrl) {
            const fileName = `processed-image-${Date.now()}.png`;
            const fileUri = `${FileSystem.documentDirectory}${fileName}`;
            
            const downloadResult = await FileSystem.downloadAsync(
              statusData.processedImageUrl, 
              fileUri
            );
            
            if (downloadResult.status === 200) {
              setProcessedImage(fileUri);
              jobComplete = true;
            } else {
              throw new Error('Failed to download processed image');
            }
          } else if (statusData.status === 'failed') {
            throw new Error(statusData.error || 'Background removal failed');
          }
          
          attempts++;
        }
        
        if (!jobComplete) {
          throw new Error('Background removal timed out');
        }
      } else {
        throw new Error(data.error || 'Failed to start background removal');
      }
    } catch (error) {
      console.error('Error removing background:', error);
      Alert.alert('Error', 'Failed to remove background. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save image handler
  const handleSave = async () => {
    try {
      setIsLoading(true);
      const currentImageUrl = getImageUrl();
      
      // Prepare image data if it's a local file
      let imageData;
      if (currentImageUrl.startsWith('file://')) {
        const response = await fetch(currentImageUrl);
        const blob = await response.blob();
        imageData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }

      // Send to compose image endpoint
      const response = await fetch(API_ENDPOINTS.COMPOSE_IMAGE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: currentImageUrl,
          imageData: imageData,
          textOverlays: textOverlays.map(overlay => ({
            text: overlay.text,
            x: overlay.x,
            y: overlay.y,
            style: {
              fontFamily: overlay.fontFamily,
              fontSize: overlay.fontSize,
              color: overlay.color
            }
          })),
          scale: scale.value,
          rotation: rotation.value,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.composedImageUrl) {
        // Download the composed image
        const fileName = `composed-image-${Date.now()}.png`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        
        const downloadResult = await FileSystem.downloadAsync(
          data.composedImageUrl,
          fileUri
        );

        if (downloadResult.status === 200) {
          // Save to user profile if logged in
          const userId = await SecureStore.getItemAsync('userId');
          if (userId) {
            // Save the composed image
            const composedImage: GeneratedImage = {
              id: `img_${Date.now()}`,
              url: data.composedImageUrl,
              createdAt: new Date(),
              prompt: 'Edited Image'
            };
            await ProfileService.saveEditedImage(userId, composedImage);
            
            // Save each text overlay
            for (const overlay of textOverlays) {
              const textData: TextData = {
                id: overlay.id,
                content: overlay.text,
                createdAt: new Date(),
                fontFamily: overlay.fontFamily,
                fontSize: overlay.fontSize,
                color: overlay.color,
                position: {
                  x: overlay.x,
                  y: overlay.y
                }
              };
              await ProfileService.saveTextData(userId, textData);
            }
          }
          
          // Update context and navigate
          setImageUrl(data.composedImageUrl);
          setPublicImageUrl(data.composedImageUrl);
          router.push({
            pathname: '/(tabs)/products',
            params: {
              publicImageUrl: data.composedImageUrl,
              productId: params.productId,
              variantId: params.variantId,
            }
          });
        }
      }
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Draggable text component
  const DraggableText = ({ overlay, index }: { overlay: TextOverlay, index: number }) => {
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setSelectedTextIndex(index);
          setActiveDragIndex(index);
        },
        onPanResponderMove: (_, gestureState) => {
          const newOverlays = [...textOverlays];
          newOverlays[index] = {
            ...newOverlays[index],
            x: newOverlays[index].x + gestureState.dx,
            y: newOverlays[index].y + gestureState.dy
          };
          setTextOverlays(newOverlays);
        },
        onPanResponderRelease: () => {
          setActiveDragIndex(null);
        }
      })
    ).current;

    return (
      <View
        {...panResponder.panHandlers}
        style={[
          styles.textOverlay,
          {
            left: overlay.x,
            top: overlay.y,
            borderWidth: selectedTextIndex === index ? 1 : 0,
            borderColor: selectedTextIndex === index ? colors.accent1 : 'transparent',
          }
        ]}
      >
        <Text
          style={{
            fontFamily: overlay.fontFamily,
            fontSize: overlay.fontSize,
            color: overlay.color,
          }}
          onLongPress={() => handleDeleteText(index)}
          onPress={() => handleEditText(index)}
        >
          {overlay.text}
        </Text>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <GestureHandlerRootView style={styles.gestureContainer}>
        <GestureDetector gesture={composed}>
          <Animated.View style={[
            styles.imageContainer,
            useAnimatedStyle(() => ({
              transform: [
                { scale: scale.value },
                { rotate: `${rotation.value}rad` },
                { translateX: translateX.value },
                { translateY: translateY.value },
              ],
            })),
          ]}>
            <ExpoImage
              source={{ uri: getImageUrl() }}
              style={styles.image}
              contentFit="contain"
            />
            
            {/* Text Overlays */}
            {textOverlays.map((overlay, index) => (
              <DraggableText key={overlay.id} overlay={overlay} index={index} />
            ))}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>

      {/* Text Input Popup */}
      {showTextInput && (
        <View style={styles.textInputContainer}>
          <TextInput
            value={textInput}
            onChangeText={setTextInput}
            style={styles.textInput}
            placeholder="Enter text"
            placeholderTextColor="#888"
            autoFocus
          />
          
          <View style={styles.textControls}>
            {/* Font Family Selection */}
            <View style={styles.fontFamilyContainer}>
              <Text style={styles.sectionLabel}>Font:</Text>
              <View style={styles.fontOptions}>
                {['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New'].map(font => (
                  <TouchableOpacity
                    key={font}
                    style={[
                      styles.fontOption,
                      fontFamily === font && styles.selectedFont
                    ]}
                    onPress={() => setFontFamily(font)}
                  >
                    <Text style={styles.fontText}>{font}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Color Picker */}
            <Text style={styles.sectionLabel}>Color:</Text>
            <View style={styles.colorPickerContainer}>
              <ColorPicker
                color={textColor}
                onColorChange={setTextColor}
                thumbSize={30}
                sliderSize={30}
                noSnap={true}
                row={false}
              />
            </View>
            
            {/* Font Size Controls */}
            <View style={styles.sizeControls}>
              <Text style={styles.sectionLabel}>Size:</Text>
              <TouchableOpacity
                style={styles.sizeButton}
                onPress={() => setFontSize(Math.max(12, fontSize - 2))}
              >
                <Text style={styles.sizeButtonText}>-</Text>
              </TouchableOpacity>
              
              <Text style={styles.sizeText}>{fontSize}</Text>
              
              <TouchableOpacity
                style={styles.sizeButton}
                onPress={() => setFontSize(Math.min(48, fontSize + 2))}
              >
                <Text style={styles.sizeButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.textActionButtons}>
            <TouchableOpacity
              style={[styles.textButton, { backgroundColor: colors.accent2 }]}
              onPress={() => setShowTextInput(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.textButton, { backgroundColor: colors.accent1 }]}
              onPress={handleSaveText}
            >
              <Text style={styles.buttonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent2 }]}
          onPress={handleRemoveBackground}
          disabled={isLoading || showTextInput}
        >
          <ThemedText style={styles.buttonText}>
            {isLoading ? 'Processing...' : 'Remove Background'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent3 }]}
          onPress={handleAddText}
          disabled={isLoading || showTextInput}
        >
          <ThemedText style={styles.buttonText}>Add Text</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent1 }]}
          onPress={handleSave}
          disabled={isLoading || showTextInput}
        >
          <ThemedText style={styles.buttonText}>
            {isLoading ? 'Saving...' : 'Save'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  gestureContainer: {
    flex: 1,
  },
  imageContainer: {
    width: screenWidth - 32,
    height: screenWidth - 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  textOverlay: {
    position: 'absolute',
    padding: 8,
    backgroundColor: 'transparent',
    borderRadius: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  textInputContainer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(30,30,40,0.95)',
    borderRadius: 12,
    padding: 16,
    maxHeight: 400,
  },
  textInput: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  textControls: {
    marginBottom: 12,
  },
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  fontFamilyContainer: {
    marginBottom: 12,
  },
  fontOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fontOption: {
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  selectedFont: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  fontText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  colorPickerContainer: {
    height: 150,
    marginBottom: 12,
  },
  sizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  sizeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  sizeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sizeText: {
    color: '#FFFFFF',
    marginHorizontal: 12,
    fontSize: 16,
  },
  textActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textButton: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});