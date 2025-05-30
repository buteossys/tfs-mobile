export interface ProductVariant {
  id: string;  // Display ID (e.g., "Daisy")
  variantId: number;  // Numeric ID for Printify API
  title: string;
  price: number;
  options: {
    size: string[];
    color?: string[];
    paper?: string[];
    depth?: string[];
    scent?: string[];
    [key: string]: string[] | undefined;
  };
  placeholders: {
    position: string;
    width: number;
    height: number;
  }[];
  printProviderId: number;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  brand: string;
  price: number;
  variants: ProductVariant[];
  images: string[];
  print_provider: {
    id: number;
    title: string;
    location: {
      address1?: string;
      address2?: string;
      city?: string;
      country?: string;
      region?: string;
      zip?: string;
    };
  };
  print_areas?: {
    [key: string]: {
      position: string;
      width: number;
      height: number;
    }[];
  };
  selectedVariant?: ProductVariant;
  selectedSize?: string;
  selectedPosition?: string;
  variantSize?: number;
}