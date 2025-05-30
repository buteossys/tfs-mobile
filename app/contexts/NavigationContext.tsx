import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { createContext, useCallback, useContext, useState } from 'react';

// Define the navigation state type
interface NavigationContextType {
  isNavigating: boolean;
  setNavigating: (value: boolean) => void;
  screenParams: any;
  setScreenParams: (params: any) => void;
}

const NavigationContext = createContext<NavigationContextType>({
  isNavigating: false,
  setNavigating: () => {},
  screenParams: {},
  setScreenParams: () => {},
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setNavigating] = useState(false);
  const [screenParams, setScreenParams] = useState({});
  const navigation = useNavigation();

  // Handle navigation state changes
  useFocusEffect(
    useCallback(() => {
      setNavigating(false);
      return () => {
        setNavigating(true);
      };
    }, [])
  );

  return (
    <NavigationContext.Provider value={{ 
      isNavigating, 
      setNavigating,
      screenParams,
      setScreenParams
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export const useNavigationState = () => useContext(NavigationContext);

// Add default export
export default NavigationProvider;
