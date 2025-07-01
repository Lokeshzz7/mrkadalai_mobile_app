// contexts/CartContext.tsx
import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { apiRequest } from '../utils/api';

// Types
interface CartProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: 'Meals' | 'Starters' | 'Desserts' | 'Beverages';
}

interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  product: CartProduct;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  lastSyncTime: number;
  initialized: boolean;
}

// Action types
type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: { productId: number; product: CartProduct; quantity?: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: number; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SYNC_SUCCESS' }
  | { type: 'SET_INITIALIZED' };

// Initial state
const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
  lastSyncTime: 0,
  initialized: false,
};

// Reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_CART':
      return { 
        ...state, 
        items: Array.isArray(action.payload) ? action.payload : [], 
        loading: false, 
        error: null,
        lastSyncTime: Date.now(),
        initialized: true
      };
    
    case 'SET_INITIALIZED':
      return { ...state, initialized: true, loading: false };
    
    case 'ADD_ITEM': {
      const { productId, product, quantity = 1 } = action.payload;
      
      if (!product || !productId) {
        console.warn('Invalid product data for ADD_ITEM');
        return state;
      }
      
      const existingItem = state.items.find(item => item.productId === productId);
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.productId === productId
              ? { ...item, quantity: Math.max(0, item.quantity + quantity) }
              : item
          ),
        };
      } else {
        const newItem: CartItem = {
          id: Date.now() + Math.random(), // More unique ID
          cartId: 1,
          productId,
          quantity: Math.max(0, quantity),
          product,
        };
        return {
          ...state,
          items: [...state.items, newItem],
        };
      }
    }
    
    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.productId !== productId),
        };
      }
      
      return {
        ...state,
        items: state.items.map(item =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, quantity) }
            : item
        ),
      };
    }
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.productId !== action.payload.productId),
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
      };
    
    case 'SYNC_SUCCESS':
      return {
        ...state,
        lastSyncTime: Date.now(),
        error: null,
      };
    
    default:
      return state;
  }
};

// Context
interface CartContextType {
  state: CartState;
  addToCart: (product: CartProduct, quantity?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  getItemQuantity: (productId: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const isMountedRef = useRef(true);
  const initializationPromiseRef = useRef<Promise<void> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Safe dispatch that checks if component is mounted
  const safeDispatch = useCallback((action: CartAction) => {
    if (isMountedRef.current) {
      dispatch(action);
    }
  }, []);

  // Fetch cart function with better error handling
  const fetchCart = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;

    try {
      safeDispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiRequest('/customer/outlets/get-cart', {
        method: 'GET'
      });
      
      if (!isMountedRef.current) return;
      
      if (response?.cart?.items && Array.isArray(response.cart.items)) {
        safeDispatch({ type: 'SET_CART', payload: response.cart.items });
      } else if (Array.isArray(response)) {
        safeDispatch({ type: 'SET_CART', payload: response });
      } else {
        safeDispatch({ type: 'SET_CART', payload: [] });
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (isMountedRef.current) {
        safeDispatch({ type: 'SET_ERROR', payload: 'Failed to fetch cart' });
        safeDispatch({ type: 'SET_INITIALIZED' });
      }
    }
  }, [safeDispatch]);

  // Initialize cart only once
  useEffect(() => {
    if (!state.initialized && !initializationPromiseRef.current) {
      initializationPromiseRef.current = fetchCart();
    }
  }, [state.initialized, fetchCart]);

  // Optimistic update with background sync
  const syncWithBackend = useCallback(async (
    operation: () => Promise<void>, 
    fallback: () => void
  ) => {
    try {
      await operation();
      if (isMountedRef.current) {
        safeDispatch({ type: 'SYNC_SUCCESS' });
      }
    } catch (error) {
      console.error('Sync failed:', error);
      if (isMountedRef.current) {
        fallback();
        // Don't show alert if component is unmounted
        setTimeout(() => {
          if (isMountedRef.current) {
            Alert.alert('Error', 'Failed to sync with server. Please try again.');
          }
        }, 100);
      }
    }
  }, [safeDispatch]);

  const addToCart = useCallback(async (product: CartProduct, quantity: number = 1) => {
    if (!product || !product.id) {
      console.warn('Invalid product for addToCart');
      return;
    }

    // Optimistic update
    safeDispatch({ type: 'ADD_ITEM', payload: { productId: product.id, product, quantity } });
    
    // Background sync
    await syncWithBackend(
      () => apiRequest('/customer/outlets/add-product-cart', {
        method: 'POST',
        body: { productId: product.id, quantity }
      }),
      () => {
        // Revert: remove the added item
        const currentQty = getItemQuantity(product.id);
        if (currentQty <= quantity) {
          safeDispatch({ type: 'REMOVE_ITEM', payload: { productId: product.id } });
        } else {
          safeDispatch({ type: 'UPDATE_QUANTITY', payload: { productId: product.id, quantity: currentQty - quantity } });
        }
      }
    );
  }, [safeDispatch, syncWithBackend]);

  const updateQuantity = useCallback(async (productId: number, quantity: number) => {
    if (!productId) {
      console.warn('Invalid productId for updateQuantity');
      return;
    }

    const oldQuantity = getItemQuantity(productId);
    
    // Optimistic update
    safeDispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
    
    // Background sync
    const quantityDiff = quantity - oldQuantity;
    await syncWithBackend(
      async () => {
        if (quantity <= 0) {
          await apiRequest('/customer/outlets/delete-product-cart', {
            method: 'DELETE',
            body: { productId }
          });
        } else {
          await apiRequest('/customer/outlets/add-product-cart', {
            method: 'POST',
            body: { productId, quantity: quantityDiff }
          });
        }
      },
      () => {
        // Revert to old quantity
        safeDispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity: oldQuantity } });
      }
    );
  }, [safeDispatch, syncWithBackend]);

  const removeFromCart = useCallback(async (productId: number) => {
    if (!productId) {
      console.warn('Invalid productId for removeFromCart');
      return;
    }

    const removedItem = state.items.find(item => item.productId === productId);
    
    // Optimistic update
    safeDispatch({ type: 'REMOVE_ITEM', payload: { productId } });
    
    // Background sync
    await syncWithBackend(
      () => apiRequest('/customer/outlets/delete-product-cart', {
        method: 'DELETE',
        body: { productId }
      }),
      () => {
        // Revert: add item back
        if (removedItem) {
          safeDispatch({ type: 'ADD_ITEM', payload: { 
            productId, 
            product: removedItem.product, 
            quantity: removedItem.quantity 
          } });
        }
      }
    );
  }, [state.items, safeDispatch, syncWithBackend]);

  const clearCart = useCallback(async () => {
    const oldItems = [...state.items];
    
    // Optimistic update
    safeDispatch({ type: 'CLEAR_CART' });
    
    // Background sync
    await syncWithBackend(
      () => apiRequest('/customer/outlets/clear-cart', {
        method: 'DELETE'
      }),
      () => {
        // Revert: restore all items
        safeDispatch({ type: 'SET_CART', payload: oldItems });
      }
    );
  }, [state.items, safeDispatch, syncWithBackend]);

  const refreshCart = useCallback(async () => {
    await fetchCart();
  }, [fetchCart]);

  // Memoized calculations
  const getCartTotal = useCallback(() => {
    if (!state.items || !Array.isArray(state.items)) return 0;
    return state.items.reduce((total, item) => {
      if (!item || !item.product || typeof item.product.price !== 'number' || typeof item.quantity !== 'number') {
        return total;
      }
      return total + (item.product.price * item.quantity);
    }, 0);
  }, [state.items]);

  const getCartItemCount = useCallback(() => {
    if (!state.items || !Array.isArray(state.items)) return 0;
    return state.items.reduce((total, item) => {
      if (!item || typeof item.quantity !== 'number') return total;
      return total + item.quantity;
    }, 0);
  }, [state.items]);

  const getItemQuantity = useCallback((productId: number) => {
    if (!productId || !state.items || !Array.isArray(state.items)) return 0;
    const item = state.items.find(item => item && item.productId === productId);
    return item?.quantity || 0;
  }, [state.items]);

  const value: CartContextType = {
    state,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
    getCartTotal,
    getCartItemCount,
    getItemQuantity,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};