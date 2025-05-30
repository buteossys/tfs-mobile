import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import React, { memo } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const BANNER_ASPECT_RATIO = 2.5;

interface GenerateScreenHeaderProps {
  prompt: string;
  handleChangeText: (text: string) => void;
  inputRef: React.RefObject<TextInput>;
  isLoading: boolean;
  generateImage: () => void;
  colorScheme: 'light' | 'dark' | null;
  colors: typeof Colors.light;
}

const GenerateScreenHeader = memo(({
  prompt,
  handleChangeText,
  inputRef,
  isLoading,
  generateImage,
  colorScheme,
  colors
}: GenerateScreenHeaderProps) => {
  return (
    <View style={styles.headerContainer}>
      <Image 
        source={require('@/assets/images/tfs-banner.png')}
        style={styles.banner}
        resizeMode="contain"
      />
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={[styles.title, { color: colors.accent3 }]}>
          Create Your Custom Design
        </ThemedText>
        
        <ThemedText style={[styles.description, { color: colorScheme === 'dark' ? colors.accent3 : colors.secondary }]}>
          Enter a detailed description of the image you want to create. Be specific about colors, style, and content.
        </ThemedText>
        
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { 
              backgroundColor: colorScheme === 'dark' ? colors.primary : '#f0f0f0',
              borderColor: colors.accent3,
              color: colorScheme === 'dark' ? '#fff' : colors.text,
              minHeight: 100,
              textAlignVertical: 'top',
              paddingTop: 10,
            }]}
            placeholder="Describe your image..."
            placeholderTextColor={colorScheme === 'dark' ? colors.accent3 : colors.icon}
            value={prompt}
            onChangeText={handleChangeText}
            multiline={true}
            returnKeyType="default"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
            maxLength={500}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.generateButton, { backgroundColor: colors.accent2 }]}
          onPress={generateImage}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Generate Image</ThemedText>
          )}
        </TouchableOpacity>
      </ThemedView>
    </View>
  );
});

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  banner: {
    width: screenWidth,
    height: screenWidth / BANNER_ASPECT_RATIO,
    marginBottom: 20,
  },
  container: {
    width: '100%',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  generateButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GenerateScreenHeader;
