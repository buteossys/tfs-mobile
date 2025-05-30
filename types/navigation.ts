// Define all possible routes in the app
export type AppRoute = 
  | '/'
  | '/generate'
  | '/products'
  | '/cart'
  | '/profile'
  | '/payment'
  | '/edit'
  | '/mockup'
  | '/profile_data'
  | '/config'
  | '/success'
  | '/(tabs)'
  | '/+not-found';

// Type for route parameters
export type RouteParams = {
  [key: string]: string | undefined;
};

// Type for navigation state
export interface NavigationState {
  previousScreen: AppRoute | null;
  navigationHistory: AppRoute[];
  screenParams: RouteParams;
}

// Type for navigation context
export interface NavigationContextType {
  navigationState: NavigationState;
  navigateTo: (screen: AppRoute, params?: RouteParams) => void;
  goBack: () => void;
  updateScreenParams: (params: RouteParams) => void;
}

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
    orderId?: string;
  };
  mockup: {
    imageUrl?: string;
    publicImageUrl?: string;
    productId: string;
    variantId: string;
    printProviderId: string;
    placeholders: string;
    variantSize: string;
    productPrice: string;
  };
  config: {
    productId?: string;
    variantId?: string;
  };
  cart: {
    productId: string;
    variantId: string;
    blueprintId: string;
    productPrice: string;
  };
}; 