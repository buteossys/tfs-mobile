import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import 'react-native-reanimated';

import { ImageProvider } from '@/app/contexts/ImageContext';
import { NavigationProvider } from '@/app/contexts/NavigationContext';
import { ProductProvider } from '@/app/contexts/ProductContext';
import { useColorScheme } from '@/hooks/useColorScheme';

// Ignore specific warnings if needed
LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered',
  'Unable to find viewState for tag',
]);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <NavigationProvider>
      <ImageProvider>
        <ProductProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack
              screenOptions={{
                headerShown: true,
                headerBackTitle: 'Back',
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </ProductProvider>
      </ImageProvider>
    </NavigationProvider>
  );
}
