import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import { SymbolViewProps } from 'expo-symbols';
import React from 'react';
import { Platform, TouchableOpacity, useColorScheme } from 'react-native';

import { ImageProvider } from '@/app/contexts/ImageContext';
import { HapticTab } from '@/components/HapticTab';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';

type SFIconName = SymbolViewProps['name'];

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();

  const getTabIcon = (iosName: SFIconName, androidName: string, color: string) => {
    if (Platform.OS === 'ios') {
      return <IconSymbol size={32} name={iosName} color={color} />;
    }
    return <MaterialIcons name={androidName as any} size={32} color={color} />;
  };

  return (
    <ImageProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          headerLeft: () => (
            <TouchableOpacity onPress={navigation.goBack} style={{ marginLeft: 16 }}>
              <ThemedText style={{ color: Colors[colorScheme ?? 'light'].tint }}>
                Back
              </ThemedText>
            </TouchableOpacity>
          ),
          tabBarStyle: {
            height: 76,
            paddingBottom: 111,
            paddingTop: 8,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            borderTopWidth: 0,
            backgroundColor: 'transparent',
          },
          tabBarItemStyle: {
            paddingVertical: 8,
          },
          animation: 'none',
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => getTabIcon('house', 'home', color),
          }}
        />
        <Tabs.Screen
          name="generate"
          options={{
            title: 'Generate',
            tabBarIcon: ({ color }) => getTabIcon('wand.and.stars.inverse', 'auto-fix-high', color),
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            title: 'Products',
            tabBarIcon: ({ color }) => getTabIcon('tshirt', 'checkroom', color),
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Cart',
            tabBarIcon: ({ color }) => getTabIcon('cart', 'shopping-cart', color),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => getTabIcon('person', 'person', color),
          }}
        />
      </Tabs>
    </ImageProvider>
  );
}