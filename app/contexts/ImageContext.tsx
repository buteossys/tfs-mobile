import React, { createContext, useContext, useState } from 'react';

interface ImageContextType {
  imageUrl: string | null;
  publicImageUrl: string | null;
  setImageUrl: (url: string) => void;
  setPublicImageUrl: (url: string) => void;
}

const ImageContext = createContext<ImageContextType | undefined>(undefined);

export function ImageProvider({ children }: { children: React.ReactNode }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [publicImageUrl, setPublicImageUrl] = useState<string | null>(null);

  return (
    <ImageContext.Provider value={{ imageUrl, publicImageUrl, setImageUrl, setPublicImageUrl }}>
      {children}
    </ImageContext.Provider>
  );
}

export function useImage() {
  const context = useContext(ImageContext);
  if (context === undefined) {
    throw new Error('useImage must be used within an ImageProvider');
  }
  return context;
}

export default ImageProvider; 