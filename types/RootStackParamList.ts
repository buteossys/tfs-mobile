// Define navigation types
export type RootStackParamList = {
    products: {
      publicImageUrl?: string;
      productId?: string;
      variantId?: string;
    };
    edit: {
      imageUrl: string;
      publicImageUrl?: string;
      prompt?: string;
    };
    payment: {
      productId: string;
      variantId: string;
      itemPrice: string;
      shippingCost: string;
      total: string;
      quantity: string;
    };
    generate: {
      productId?: string;
      variantId?: string;
    };
    profile_data: {
      userId?: string;
    };
    mockup: {
      imageUrl: string;
      publicImageUrl?: string;
    };
    config: {
      productId?: string;
      variantId?: string;
    };
  };