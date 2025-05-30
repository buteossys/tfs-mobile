// types/Profile.ts
export interface GeneratedImage {
    id: string;
    url: string;
    createdAt: Date;
    prompt?: string;
  }
  
  export interface UserImage {
    id: string;
    url: string;
    createdAt: Date;
    name?: string;
  }

  export interface EditedImage {
    id: string;
    url: string;
    createdAt: Date;
    name?: string;
  }
  
  export interface TextData {
    id: string;
    content: string;
    createdAt: Date;
    name?: string;
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    position?: {
      x: number;
      y: number;
    };
  }
  
  export interface Design {
    id: string;
    productId: number;
    variantId: number;
    imageUrl: string;
    textData?: string;
    createdAt: Date;
    name?: string;
  }
  
  export interface Order {
    id: string;
    orderId: string;
    productId: number;
    variantId: number;
    quantity: number;
    price: number;
    status: string;
    shippingAddress: string;
    createdAt: Date;
    imageUrl?: string;
  }
  
  export interface Profile {
    id: number;
    name: string;
    email: string;
    password: string;
    address: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    gen_images: GeneratedImage[];
    user_images: UserImage[];
    text: TextData[];
    designs: Design[];
    orders: Order[];
  }
  