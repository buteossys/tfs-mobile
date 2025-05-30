// app/profile-data.tsx
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ProfileService } from '@/services/ProfileService';
import { Design, EditedImage, GeneratedImage, Order, TextData, UserImage } from '@/types/Profile';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ProfileDataScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'images' | 'uploads' | 'edited'  |  'text' | 'designs' | 'orders'>('images');
  
  // State for user data
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [genImages, setGenImages] = useState<GeneratedImage[]>([]);
  const [userImages, setUserImages] = useState<UserImage[]>([]);
  const [editedImages, setEditedImages] = useState<EditedImage[]>([]);
  const [textData, setTextData] = useState<TextData[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check login status and load data
  useEffect(() => {
    const checkLoginAndLoadData = async () => {
      try {
        const userId = await SecureStore.getItemAsync('userId');
        setIsLoggedIn(!!userId);
        
        if (userId) {
          setIsLoading(true);
          try {
            // Load all user data with individual error handling
            const [genImagesData, userImagesData, editedImagesData, textDataData, designsData, ordersData] = await Promise.all([
              ProfileService.getGeneratedImages(userId).catch(e => {
                console.error('Error loading generated images:', e);
                return [];
              }),
              ProfileService.getUserImages(userId).catch(e => {
                console.error('Error loading user images:', e);
                return [];
              }),
              ProfileService.getEditedImages(userId).catch(e => {
                console.error('Error loading user images:', e);
                return [];
              }),
              ProfileService.getTextData(userId).catch(e => {
                console.error('Error loading text data:', e);
                return [];
              }),
              ProfileService.getDesigns(userId).catch(e => {
                console.error('Error loading designs:', e);
                return [];
              }),
              ProfileService.getOrders(userId).catch(e => {
                console.error('Error loading orders:', e);
                return [];
              })
            ]);

            setGenImages(genImagesData);
            setUserImages(userImagesData);
            setEditedImages(editedImagesData);
            setTextData(textDataData);
            setDesigns(designsData);
            setOrders(ordersData);
          } catch (error) {
            console.error('Error loading profile data:', error);
            Alert.alert('Error', 'Failed to load some data. Please try again.');
          }
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginAndLoadData();
  }, []);

  const handleLogin = () => {
    router.push('/(tabs)/profile');
  };

  const handleEdit = (item: any, type: string) => {
    console.log(`Editing ${type}:`, item);
    switch (type) {
      case 'gen_image':
        router.push({
          pathname: '/edit',
          params: {
            imageUrl: item.url,
            publicImageUrl: item.url,
            prompt: item.prompt
          }
        });
        break;
      case 'user_image':
        router.push({
          pathname: '/edit',
          params: {
            imageUrl: item.url,
            publicImageUrl: item.url
          }
        });
        break;
      case 'text':
        // Handle text editing
        break;
      case 'design':
        router.push({
          pathname: '/edit',
          params: {
            imageUrl: item.imageUrl,
            publicImageUrl: item.imageUrl
          }
        });
        break;
    }
  };

  const handleUse = (item: any, type: string) => {
    console.log(`Using ${type}:`, item);
    switch (type) {
      case 'gen_image':
      case 'user_image':
      case 'edited_image':
        router.push({
          pathname: '/(tabs)/products',
          params: {
            publicImageUrl: item.url
          }
        });
        break;
      case 'text':
        // Handle text usage
        break;
    }
  };

  const handleReorder = (order: Order) => {
    console.log('Reordering:', order);
    router.push({
      pathname: '/(tabs)/products',
      params: {
        publicImageUrl: order.imageUrl
      }
    });
  };

  const handleBack = () => {
    router.back();
  };

  const handleRefresh = async () => {
    if (!isLoggedIn) return;
    
    setIsLoading(true);
    try {
      const userId = await SecureStore.getItemAsync('userId');
      if (userId) {
        const [genImagesData, userImagesData, editedImagesData, textDataData, designsData, ordersData] = await Promise.all([
          ProfileService.getGeneratedImages(userId),
          ProfileService.getUserImages(userId),
          ProfileService.getEditedImages(userId),
          ProfileService.getTextData(userId),
          ProfileService.getDesigns(userId),
          ProfileService.getOrders(userId)
        ]);

        setGenImages(genImagesData);
        setUserImages(userImagesData);
        setEditedImages(editedImagesData);
        setTextData(textDataData);
        setDesigns(designsData);
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a helper function to format dates
  const formatDate = (date: Date | undefined | null): string => {
    if (!date) return 'No date';
    try {
      return new Date(date).toLocaleDateString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  const renderGenImages = ({ item }: { item: GeneratedImage }) => (
    <View style={[styles.card, { backgroundColor: colors.secondary }]}>
      <Image source={{ uri: item.url }} style={styles.image} />
      <ThemedText style={styles.itemText}>{item.prompt || 'No prompt'}</ThemedText>
      <ThemedText style={styles.dateText}>{formatDate(item.createdAt)}</ThemedText>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent3 }]}
          onPress={() => handleEdit(item, 'gen_image')}
        >
          <ThemedText style={styles.buttonText}>Edit</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent2 }]}
          onPress={() => handleUse(item, 'gen_image')}
        >
          <ThemedText style={styles.buttonText}>Use</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUserImages = ({ item }: { item: UserImage }) => (
    <View style={[styles.card, { backgroundColor: colors.secondary }]}>
      <Image source={{ uri: item.url }} style={styles.image} />
      <ThemedText style={styles.itemText}>{item.name || 'Unnamed'}</ThemedText>
      <ThemedText style={styles.dateText}>{formatDate(item.createdAt)}</ThemedText>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent3 }]}
          onPress={() => handleEdit(item, 'user_image')}
        >
          <ThemedText style={styles.buttonText}>Edit</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent2 }]}
          onPress={() => handleUse(item, 'user_image')}
        >
          <ThemedText style={styles.buttonText}>Use</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEditedImages = ({ item }: { item: EditedImage }) => (
    <View style={[styles.card, { backgroundColor: colors.secondary }]}>
      <Image source={{ uri: item.url }} style={styles.image} />
      <ThemedText style={styles.itemText}>{item.name || 'Unnamed'}</ThemedText>
      <ThemedText style={styles.dateText}>{formatDate(item.createdAt)}</ThemedText>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent3 }]}
          onPress={() => handleEdit(item, 'edited_image')}
        >
          <ThemedText style={styles.buttonText}>Edit</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent2 }]}
          onPress={() => handleUse(item, 'edited_image')}
        >
          <ThemedText style={styles.buttonText}>Use</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTextData = ({ item }: { item: TextData }) => (
    <View style={[styles.card, { backgroundColor: colors.secondary }]}>
      <ThemedText style={styles.itemText}>{item.name || 'Unnamed'}</ThemedText>
      <ThemedText style={styles.contentText} numberOfLines={3}>{item.content}</ThemedText>
      <ThemedText style={styles.dateText}>{formatDate(item.createdAt)}</ThemedText>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent3 }]}
          onPress={() => handleEdit(item, 'text')}
        >
          <ThemedText style={styles.buttonText}>Edit</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent2 }]}
          onPress={() => handleUse(item, 'text')}
        >
          <ThemedText style={styles.buttonText}>Use</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDesigns = ({ item }: { item: Design }) => (
    <View style={[styles.card, { backgroundColor: colors.secondary }]}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <ThemedText style={styles.itemText}>{item.name || 'Unnamed design'}</ThemedText>
      <ThemedText style={styles.dateText}>{formatDate(item.createdAt)}</ThemedText>
      <TouchableOpacity
        style={[styles.fullButton, { backgroundColor: colors.accent3 }]}
        onPress={() => handleEdit(item, 'design')}
      >
        <ThemedText style={styles.buttonText}>Edit Design</ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderOrders = ({ item }: { item: Order }) => (
    <View style={[styles.card, { backgroundColor: colors.secondary }]}>
      {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.image} />}
      <ThemedText style={styles.itemText}>Order #{item.orderId}</ThemedText>
      <ThemedText style={styles.contentText}>${item.price.toFixed(2)} • {item.status}</ThemedText>
      <ThemedText style={styles.dateText}>{formatDate(item.createdAt)}</ThemedText>
      <TouchableOpacity
        style={[styles.fullButton, { backgroundColor: colors.accent2 }]}
        onPress={() => handleReorder(item)}
      >
        <ThemedText style={styles.buttonText}>Reorder</ThemedText>
      </TouchableOpacity>
    </View>
  );

  if (!isLoggedIn) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.primary }]}>
        <ThemedText type="subtitle" style={[styles.title, { color: colors.accent3 }]}>
          Your Data
        </ThemedText>
        <View style={styles.notLoggedInContainer}>
          <ThemedText style={styles.notLoggedInText}>
            You need to be logged in to view your data
          </ThemedText>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.accent2 }]}
            onPress={handleLogin}
          >
            <ThemedText style={styles.buttonText}>Login</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.primary }]}>
        <ThemedText type="subtitle" style={[styles.title, { color: colors.accent3 }]}>
          Your Data
        </ThemedText>
        <View style={styles.loadingContainer}>
          <ThemedText>Loading your data...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.primary }]}>
      <ThemedText type="subtitle" style={[styles.title, { color: colors.accent3 }]}>
        Your Data
      </ThemedText>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'images' && { borderBottomColor: colors.accent2, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('images')}
        >
          <ThemedText style={styles.tabText}>AI Images</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'uploads' && { borderBottomColor: colors.accent2, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('uploads')}
        >
          <ThemedText style={styles.tabText}>Uploads</ThemedText>
        </TouchableOpacity>
         <TouchableOpacity
          style={[styles.tab, activeTab === 'edited' && { borderBottomColor: colors.accent2, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('edited')}
        >
          <ThemedText style={styles.tabText}>Edited Images</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'text' && { borderBottomColor: colors.accent2, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('text')}
        >
          <ThemedText style={styles.tabText}>Text</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'designs' && { borderBottomColor: colors.accent2, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('designs')}
        >
          <ThemedText style={styles.tabText}>Designs</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && { borderBottomColor: colors.accent2, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('orders')}
        >
          <ThemedText style={styles.tabText}>Orders</ThemedText>
        </TouchableOpacity>
      </View>

      {activeTab === 'images' && (
        <FlatList
          data={genImages}
          renderItem={renderGenImages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>No AI-generated images yet</ThemedText>
          }
        />
      )}

      {activeTab === 'uploads' && (
        <FlatList
          data={userImages}
          renderItem={renderUserImages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>No uploaded images yet</ThemedText>
          }
        />
      )}

      {activeTab === 'edited' && (
        <FlatList
          data={editedImages}
          renderItem={renderEditedImages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>No uploaded images yet</ThemedText>
          }
        />
      )}

      {activeTab === 'text' && (
        <FlatList
          data={textData}
          renderItem={renderTextData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>No saved text yet</ThemedText>
          }
        />
      )}

      {activeTab === 'designs' && (
        <FlatList
          data={designs}
          renderItem={renderDesigns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>No designs yet</ThemedText>
          }
        />
      )}

      {activeTab === 'orders' && (
        <FlatList
          data={orders}
          renderItem={renderOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>No orders yet</ThemedText>
          }
        />
      )}

      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: colors.accent3 }]}
        onPress={handleBack}
      >
        <ThemedText style={styles.buttonText}>Back to Profile</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

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
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 80,
  },
  card: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 4,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contentText: {
    fontSize: 14,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  fullButton: {
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notLoggedInText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.7,
  },
});
