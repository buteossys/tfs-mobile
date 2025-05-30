import { Product } from '@/types/Product';
import React, { createContext, useContext, useState } from 'react';

interface ProductContextType {
  selectedProduct: Product | null;
  selectedImage: string | null;
  setSelectedProduct: (product: Product | null) => void;
  setSelectedImage: (image: string | null) => void;
  clearProductData: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const clearProductData = () => {
    setSelectedProduct(null);
    setSelectedImage(null);
  };

  return (
    <ProductContext.Provider 
      value={{ 
        selectedProduct, 
        selectedImage, 
        setSelectedProduct, 
        setSelectedImage,
        clearProductData 
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
}

export default ProductProvider;
