import { Design, GeneratedImage, Order, TextData, UserImage } from '@/types/Profile';

const S3_BUCKET_URL = 'https://tfsmobile-users.s3.amazonaws.com';

export class ProfileService {
  static async saveGeneratedImage(userId: string, image: GeneratedImage): Promise<void> {
    try {
      // First save the individual image file
      const response = await fetch(`${S3_BUCKET_URL}/${userId}/data/gen_images/${image.id}.json`, {
        method: 'PUT',
        body: JSON.stringify(image)
      });
      if (!response.ok) throw new Error('Failed to save generated image');
      
      // Then update the list file
      // First get existing images
      let images: GeneratedImage[] = [];
      try {
        const listResponse = await fetch(`${S3_BUCKET_URL}/${userId}/data/gen_images/list.json`);
        if (listResponse.ok) {
          images = await listResponse.json();
        }
      } catch (e) {
        // List might not exist yet, that's ok
      }
      
      // Add new image to the list
      images.push(image);
      
      // Update the list file
      const listUpdateResponse = await fetch(`${S3_BUCKET_URL}/${userId}/data/gen_images/list.json`, {
        method: 'PUT',
        body: JSON.stringify(images)
      });
      
      if (!listUpdateResponse.ok) throw new Error('Failed to update generated images list');
    } catch (error) {
      console.error('Error saving generated image:', error);
      throw error;
    }
  }

  static async getGeneratedImages(userId: string): Promise<GeneratedImage[]> {
    try {
      const response = await fetch(`${S3_BUCKET_URL}/${userId}/data/gen_images/list.json`);
      if (!response.ok) return [];
      const images = await response.json();
      // Parse dates for each image
      return images.map((image: any) => ({
        ...image,
        createdAt: this.parseDate(image.createdAt)
      }));
    } catch (error) {
      console.error('Error fetching generated images:', error);
      return [];
    }
  }

  // User Images
  static async saveUserImage(userId: string, image: UserImage): Promise<void> {
    try {
      // First save the individual image file
      const response = await fetch(`${S3_BUCKET_URL}/${userId}/data/user_images/${image.id}.json`, {
        method: 'PUT',
        body: JSON.stringify(image)
      });
      if (!response.ok) throw new Error('Failed to save user image');
      
      // Then update the list file
      // First get existing images
      let images: UserImage[] = [];
      try {
        const listResponse = await fetch(`${S3_BUCKET_URL}/${userId}/data/user_images/list.json`);
        if (listResponse.ok) {
          images = await listResponse.json();
        }
      } catch (e) {
        // List might not exist yet, that's ok
      }
      
      // Add new image to the list
      images.push(image);
      
      // Update the list file
      const listUpdateResponse = await fetch(`${S3_BUCKET_URL}/${userId}/data/user_images/list.json`, {
        method: 'PUT',
        body: JSON.stringify(images)
      });
      
      if (!listUpdateResponse.ok) throw new Error('Failed to update user images list');
    } catch (error) {
      console.error('Error saving user image:', error);
      throw error;
    }
  }

  static async getUserImages(userId: string): Promise<UserImage[]> {
    try {
      const response = await fetch(`${S3_BUCKET_URL}/${userId}/data/user_images/list.json`);
      if (!response.ok) return [];
      const images = await response.json();
      // Parse dates for each image
      return images.map((image: any) => ({
        ...image,
        createdAt: this.parseDate(image.createdAt)
      }));
    } catch (error) {
      console.error('Error fetching user images:', error);
      return [];
    }
  }

  // Edited Images
  static async saveEditedImage(userId: string, image: UserImage): Promise<void> {
    try {
      // First save the individual image file
      const response = await fetch(`${S3_BUCKET_URL}/${userId}/data/edited_images/${image.id}.json`, {
        method: 'PUT',
        body: JSON.stringify(image)
      });
      if (!response.ok) throw new Error('Failed to save user image');
      
      // Then update the list file
      // First get existing images
      let images: UserImage[] = [];
      try {
        const listResponse = await fetch(`${S3_BUCKET_URL}/${userId}/data/edited_images/list.json`);
        if (listResponse.ok) {
          images = await listResponse.json();
        }
      } catch (e) {
        // List might not exist yet, that's ok
      }
      
      // Add new image to the list
      images.push(image);
      
      // Update the list file
      const listUpdateResponse = await fetch(`${S3_BUCKET_URL}/${userId}/data/edited_images/list.json`, {
        method: 'PUT',
        body: JSON.stringify(images)
      });
      
      if (!listUpdateResponse.ok) throw new Error('Failed to update user images list');
    } catch (error) {
      console.error('Error saving user image:', error);
      throw error;
    }
  }

  static async getEditedImages(userId: string): Promise<UserImage[]> {
    try {
      const response = await fetch(`${S3_BUCKET_URL}/${userId}/data/edited_images/list.json`);
      if (!response.ok) return [];
      const images = await response.json();
      // Parse dates for each image
      return images.map((image: any) => ({
        ...image,
        createdAt: this.parseDate(image.createdAt)
      }));
    } catch (error) {
      console.error('Error fetching user images:', error);
      return [];
    }
  }

  // Text Data
  static async saveTextData(userId: string, text: TextData): Promise<void> {
    try {
      // First save the individual text file
      const response = await fetch(`${S3_BUCKET_URL}/${userId}/data/texts/${text.id}.json`, {
        method: 'PUT',
        body: JSON.stringify(text)
      });
      if (!response.ok) throw new Error('Failed to save text data');
      
      // Then update the list file
      // First get existing texts
      let texts: TextData[] = [];
      try {
        const listResponse = await fetch(`${S3_BUCKET_URL}/${userId}/data/texts/list.json`);
        if (listResponse.ok) {
          texts = await listResponse.json();
        }
      } catch (e) {
        // List might not exist yet, that's ok
      }
      
      // Add new text to the list
      texts.push(text);
      
      // Update the list file
      const listUpdateResponse = await fetch(`${S3_BUCKET_URL}/${userId}/data/texts/list.json`, {
        method: 'PUT',
        body: JSON.stringify(texts)
      });
      
      if (!listUpdateResponse.ok) throw new Error('Failed to update texts list');
    } catch (error) {
      console.error('Error saving text data:', error);
      throw error;
    }
  }

  static async getTextData(userId: string): Promise<TextData[]> {
    try {
      const response = await fetch(`${S3_BUCKET_URL}/${userId}/data/texts/list.json`);
      if (!response.ok) return [];
      const texts = await response.json();
      // Parse dates for each text
      return texts.map((text: any) => ({
        ...text,
        createdAt: this.parseDate(text.createdAt)
      }));
    } catch (error) {
      console.error('Error fetching text data:', error);
      return [];
    }
  }

  // Designs
  static async saveDesign(userId: string, design: Design): Promise<void> {
    try {
      // First save the individual design file
      const response = await fetch(`${S3_BUCKET_URL}/${userId}/data/designs/${design.id}.json`, {
        method: 'PUT',
        body: JSON.stringify(design)
      });
      if (!response.ok) throw new Error('Failed to save design');
      
      // Then update the list file
      // First get existing designs
      let designs: Design[] = [];
      try {
        const listResponse = await fetch(`${S3_BUCKET_URL}/${userId}/data/designs/list.json`);
        if (listResponse.ok) {
          designs = await listResponse.json();
        }
      } catch (e) {
        // List might not exist yet, that's ok
      }
      
      // Add new design to the list
      designs.push(design);
      
      // Update the list file
      const listUpdateResponse = await fetch(`${S3_BUCKET_URL}/${userId}/data/designs/list.json`, {
        method: 'PUT',
        body: JSON.stringify(designs)
      });
      
      if (!listUpdateResponse.ok) throw new Error('Failed to update designs list');
    } catch (error) {
      console.error('Error saving design:', error);
      throw error;
    }
  }

  static async getDesigns(userId: string): Promise<Design[]> {
    try {
      const response = await fetch(`${S3_BUCKET_URL}/${userId}/data/designs/list.json`);
      if (!response.ok) return [];
      const designs = await response.json();
      // Parse dates for each design
      return designs.map((design: any) => ({
        ...design,
        createdAt: this.parseDate(design.createdAt)
      }));
    } catch (error) {
      console.error('Error fetching designs:', error);
      return [];
    }
  }
    

  // Orders
  static async saveOrder(userId: string, order: Order): Promise<void> {
    try {
      // First save the individual order file
      const response = await fetch(`${S3_BUCKET_URL}/${userId}/data/orders/${order.id}.json`, {
        method: 'PUT',
        body: JSON.stringify(order)
      });
      if (!response.ok) throw new Error('Failed to save order');
      
      // Then update the list file
      // First get existing orders
      let orders: Order[] = [];
      try {
        const listResponse = await fetch(`${S3_BUCKET_URL}/${userId}/data/orders/list.json`);
        if (listResponse.ok) {
          orders = await listResponse.json();
        }
      } catch (e) {
        // List might not exist yet, that's ok
      }
      
      // Add new order to the list
      orders.push(order);
      
      // Update the list file
      const listUpdateResponse = await fetch(`${S3_BUCKET_URL}/${userId}/data/orders/list.json`, {
        method: 'PUT',
        body: JSON.stringify(orders)
      });
      
      if (!listUpdateResponse.ok) throw new Error('Failed to update orders list');
    } catch (error) {
      console.error('Error saving order:', error);
      throw error;
    }
  }

  static async getOrders(userId: string): Promise<Order[]> {
    try {
      const response = await fetch(`${S3_BUCKET_URL}/${userId}/data/orders/list.json`);
      if (!response.ok) return [];
      const orders = await response.json();
      // Parse dates for each order
      return orders.map((order: any) => ({
        ...order,
        createdAt: this.parseDate(order.createdAt)
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  // Add a helper function to parse dates
  private static parseDate(dateString: string | Date): Date {
    if (dateString instanceof Date) return dateString;
    return new Date(dateString);
  }
}

