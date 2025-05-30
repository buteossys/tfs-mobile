import { useNavigationState } from '@/app/contexts/NavigationContext';
import type { RootStackParamList } from '@/types/navigation';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isNavigating } = useNavigationState();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const features = [
    {
      title: 'AI-Powered Design',
      description: 'Create unique designs using advanced AI technology',
      icon: '🎨',
    },
    {
      title: 'Custom Products',
      description: 'Choose from a variety of high-quality products',
      icon: '👕',
    },
    {
      title: 'Fast Delivery',
      description: 'Get your custom products delivered quickly',
      icon: '🚚',
    },
  ];

  const handleNavigateToGenerate = () => {
    navigation.navigate('generate', {
      productId: undefined,
      variantId: undefined
    });
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={styles.bannerContainer}>
        <Image
          source={require('@/assets/images/tfs-banner.png')}
          style={styles.banner}
          contentFit="contain"
        />
      </View>

      <View style={styles.content}>
        <ThemedText type="title" style={[styles.title, { color: colors.accent3 }]}>
          Create Your Custom Products
        </ThemedText>

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={[styles.featureCard, { backgroundColor: colors.secondary }]}>
              <View style={styles.featureHeader}>
                <ThemedText style={styles.featureIcon}>{feature.icon}</ThemedText>
                <ThemedText style={[styles.featureTitle, { color: colors.accent3 }]}>
                  {feature.title}
                </ThemedText>
              </View>
              <ThemedText style={[styles.featureDescription, { color: colors.accent3 }]}>
                {feature.description}
              </ThemedText>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.getStartedButton, { backgroundColor: colors.accent2 }]}
          onPress={handleNavigateToGenerate}>
          <ThemedText style={styles.getStartedText}>Get Started</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    paddingTop: 12,
    paddingBottom: 76,
  },
  bannerContainer: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
  },
  banner: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    padding: 10,
    gap: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  featuresContainer: {
    gap: 16,
  },
  featureCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  featureDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
  getStartedButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  getStartedText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
