import React, { createContext, useContext, useReducer, useRef, useCallback } from 'react'
import { apiRequest } from '../utils/api'

// Types
interface CartProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: 'Meals' | 'Starters' | 'Desserts' | 'Beverages';
  inventory?: {
    quantity: number;
    reserved: number;
  };
}

interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  product: CartProduct;
}

interface CartData {
  id: number;
  customerId: number;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

interface CartState {
  cartData: CartData | null;
  cartItems: {[key: number]: number};
  loading: boolean;
  error: string | null;
  syncInProgress: boolean;
  updateErrors: {[key: number]: string}; // Track individual item errors
}

type CartAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CART_DATA'; payload: CartData | null }
  | { type: 'SET_CART_ITEMS'; payload: {[key: number]: number} }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_ITEM_QUANTITY'; payload: { productId: number; quantity: number; product?: CartProduct } }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'SET_SYNC_IN_PROGRESS'; payload: boolean }
  | { type: 'SET_UPDATE_ERROR'; payload: { productId: number; error: string | null } }
  | { type: 'CLEAR_CART' }
  | { type: 'REFRESH_CART' }

const initialState: CartState = {
  cartData: null,
  cartItems: {},
  loading: false,
  error: null,
  syncInProgress: false,
  updateErrors: {},
}

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_CART_DATA':
      return { ...state, cartData: action.payload }
    
    case 'SET_CART_ITEMS':
      return { ...state, cartItems: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'SET_UPDATE_ERROR':
      const newUpdateErrors = { ...state.updateErrors }
      if (action.payload.error) {
        newUpdateErrors[action.payload.productId] = action.payload.error
      } else {
        delete newUpdateErrors[action.payload.productId]
      }
      return { ...state, updateErrors: newUpdateErrors }
    
    case 'UPDATE_ITEM_QUANTITY':
      const { productId, quantity, product } = action.payload
      const newCartItems = { ...state.cartItems }
      
      if (quantity <= 0) {
        delete newCartItems[productId]
      } else {
        newCartItems[productId] = quantity
      }

      // Update cartData if it exists
      let newCartData = state.cartData
      if (newCartData && product) {
        const existingItemIndex = newCartData.items.findIndex(item => item.productId === productId)
        
        if (existingItemIndex >= 0) {
          if (quantity <= 0) {
            // Remove item
            newCartData = {
              ...newCartData,
              items: newCartData.items.filter(item => item.productId !== productId)
            }
          } else {
            // Update quantity
            newCartData = {
              ...newCartData,
              items: newCartData.items.map(item => 
                item.productId === productId 
                  ? { ...item, quantity }
                  : item
              )
            }
          }
        } else if (quantity > 0) {
          // Add new item
          const newItem: CartItem = {
            id: Date.now(),
            cartId: newCartData.id || 1,
            productId,
            quantity,
            product
          }
          newCartData = {
            ...newCartData,
            items: [...newCartData.items, newItem]
          }
        }
      }

      return { 
        ...state, 
        cartItems: newCartItems,
        cartData: newCartData
      }
    
    case 'REMOVE_ITEM':
      const filteredCartItems = { ...state.cartItems }
      delete filteredCartItems[action.payload]
      
      const filteredCartData = state.cartData ? {
        ...state.cartData,
        items: state.cartData.items.filter(item => item.productId !== action.payload)
      } : null

      return { 
        ...state, 
        cartItems: filteredCartItems,
        cartData: filteredCartData
      }
    
    case 'SET_SYNC_IN_PROGRESS':
      return { ...state, syncInProgress: action.payload }
    
    case 'CLEAR_CART':
      return {
        ...state,
        cartData: null,
        cartItems: {},
        error: null,
        updateErrors: {},
      }
    
    case 'REFRESH_CART':
      return {
        ...state,
        error: null,
        updateErrors: {},
      }
    
    default:
      return state
  }
}

const CartContext = createContext<{
  state: CartState;
  fetchCartData: () => Promise<void>;
  updateItemQuantity: (productId: number, change: number, product?: CartProduct, maxStock?: number) => Promise<boolean>;
  removeItem: (productId: number) => Promise<void>;
  getTotalCartItems: () => number;
  getItemQuantity: (productId: number) => number;
  canAddMore: (productId: number, currentStock: number) => boolean;
  clearCart: () => void;
  getTotalPrice: () => number;
  isItemUpdating: (productId: number) => boolean;
  refreshCart: () => Promise<void>;
  getItemError: (productId: number) => string | null;
  validateCartStock: () => Promise<boolean>;
  refreshProducts: () => Promise<void>;
} | null>(null)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  
  // Background sync queue
  const syncQueue = useRef<Map<number, { oldQuantity: number; newQuantity: number }>>(new Map())
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUpdatingRef = useRef<Set<number>>(new Set())

  const fetchCartData = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      
      const response = await apiRequest('/customer/outlets/get-cart', {
        method: 'GET'
      })
      
      if (response.cart) {
        dispatch({ type: 'SET_CART_DATA', payload: response.cart })
        
        // Convert to cartItems format
        const cartMap: {[key: number]: number} = {}
        response.cart.items.forEach((item: CartItem) => {
          cartMap[item.productId] = item.quantity
        })
        dispatch({ type: 'SET_CART_ITEMS', payload: cartMap })
      } else {
        dispatch({ type: 'SET_CART_DATA', payload: null })
        dispatch({ type: 'SET_CART_ITEMS', payload: {} })
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch cart data' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const validateCartStock = useCallback(async () => {
  try {
    // Re-fetch cart data to get latest stock info
    await fetchCartData()
    return true
  } catch (error) {
    console.error('Error validating cart stock:', error)
    return false
  }
}, [fetchCartData])

const refreshProducts = useCallback(async () => {
  try {
    // This should refresh product data - you might need to implement this
    // based on your product context/API
    await fetchCartData() // For now, just refresh cart
  } catch (error) {
    console.error('Error refreshing products:', error)
  }
}, [fetchCartData])

  const syncPendingChanges = useCallback(async () => {
    if (syncQueue.current.size === 0 || state.syncInProgress) return
    
    dispatch({ type: 'SET_SYNC_IN_PROGRESS', payload: true })
    
    try {
      // Process each item in the queue
      for (const [productId, { oldQuantity, newQuantity }] of syncQueue.current.entries()) {
        try {
          dispatch({ type: 'SET_UPDATE_ERROR', payload: { productId, error: null } })
          
          if (newQuantity === 0) {
            // Remove all items
            await apiRequest('/customer/outlets/update-cart-item', {
              method: 'PUT',
              body: {
                productId: productId,
                quantity: oldQuantity, // Remove all existing quantity
                action: 'remove'
              }
            })
          } else if (oldQuantity === 0) {
            // Add new items
            await apiRequest('/customer/outlets/update-cart-item', {
              method: 'PUT',
              body: {
                productId: productId,
                quantity: newQuantity,
                action: 'add'
              }
            })
          } else if (newQuantity > oldQuantity) {
            // Add more items
            const addQuantity = newQuantity - oldQuantity
            await apiRequest('/customer/outlets/update-cart-item', {
              method: 'PUT',
              body: {
                productId: productId,
                quantity: addQuantity,
                action: 'add'
              }
            })
          } else if (newQuantity < oldQuantity) {
            // Remove some items
            const removeQuantity = oldQuantity - newQuantity
            await apiRequest('/customer/outlets/update-cart-item', {
              method: 'PUT',
              body: {
                productId: productId,
                quantity: removeQuantity,
                action: 'remove'
              }
            })
          }
        } catch (error: any) {
          console.error(`Error syncing item ${productId}:`, error)
          
          // Handle specific stock errors
          if (error.message?.includes('stock') || error.message?.includes('inventory')) {
            dispatch({ type: 'SET_UPDATE_ERROR', payload: { 
              productId, 
              error: 'Insufficient stock available' 
            }})
            
            // Revert the quantity to what's actually available
            // This will trigger a re-fetch to get current stock
            await fetchCartData()
          } else {
            dispatch({ type: 'SET_UPDATE_ERROR', payload: { 
              productId, 
              error: 'Failed to update item' 
            }})
          }
        }
      }
      
      // Clear the queue after processing
      syncQueue.current.clear()
      
    } catch (error) {
      console.error('Error syncing cart changes:', error)
    } finally {
      dispatch({ type: 'SET_SYNC_IN_PROGRESS', payload: false })
    }
  }, [state.syncInProgress, fetchCartData])

// Fixed updateItemQuantity in CartContext
const updateItemQuantity = useCallback(async (productId: number, change: number, product?: CartProduct, maxStock?: number): Promise<boolean> => {
    const currentQuantity = state.cartItems[productId] || 0
    const newQuantity = currentQuantity + change
    
    // Calculate available stock correctly if product is provided
    let availableStock = maxStock || 0
if (product && product.inventory) {
  const totalStock = product.inventory.quantity || 0
  const reservedStock = product.inventory.reserved || 0
  const currentQuantity = state.cartItems[productId] || 0
  availableStock = Math.max(0, totalStock - reservedStock - currentQuantity)
}

    
    console.log(`CartContext update for product ${productId}:`, {
        currentQuantity,
        change,
        newQuantity,
        availableStock,
        maxStock
    })
    
    // Validate stock limits
    if (change > 0 && availableStock > 0 && newQuantity > availableStock) {
        dispatch({ type: 'SET_UPDATE_ERROR', payload: { 
            productId, 
            error: `Only ${availableStock} items available` 
        }})
        return false
    }
    
    // Don't allow negative quantities
    if (newQuantity < 0) {
        return false
    }
    
    // Clear any existing errors for this item
    dispatch({ type: 'SET_UPDATE_ERROR', payload: { productId, error: null } })
    
    // Store the old quantity before update for sync
    const oldQuantity = currentQuantity
    
    // Mark as updating
    isUpdatingRef.current.add(productId)
    
    // INSTANT UI UPDATE
    dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { productId, quantity: newQuantity, product } })
    
    // Add to background sync queue
    syncQueue.current.set(productId, { oldQuantity, newQuantity })
    
    // Debounced background sync
    if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
    }
    
    syncTimeoutRef.current = setTimeout(async () => {
        await syncPendingChanges()
        isUpdatingRef.current.delete(productId)
    }, 800)
    
    return true
}, [state.cartItems, syncPendingChanges])

// Fixed canAddMore function
const canAddMore = useCallback((productId: number, currentStock: number) => {
    const currentQuantity = state.cartItems[productId] || 0
    // currentStock should be available stock (total - reserved)
    return currentQuantity < currentStock && currentStock > 0
}, [state.cartItems])

  const removeItem = useCallback(async (productId: number) => {
    const currentQuantity = state.cartItems[productId] || 0
    
    // Clear any existing errors
    dispatch({ type: 'SET_UPDATE_ERROR', payload: { productId, error: null } })
    
    // INSTANT UI UPDATE
    dispatch({ type: 'REMOVE_ITEM', payload: productId })
    
    // Background sync - immediate for removals
    try {
      await apiRequest('/customer/outlets/update-cart-item', {
        method: 'PUT',
        body: {
          productId: productId,
          quantity: currentQuantity,
          action: 'remove'
        }
      })
    } catch (error) {
      console.error('Error removing item:', error)
      // Revert if failed
      dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { productId, quantity: currentQuantity } })
    }
  }, [state.cartItems])

  const getTotalCartItems = useCallback(() => {
    return Object.values(state.cartItems).reduce((total, quantity) => total + quantity, 0)
  }, [state.cartItems])

  const getItemQuantity = useCallback((productId: number) => {
    return state.cartItems[productId] || 0
  }, [state.cartItems])

  const getTotalPrice = useCallback(() => {
    if (!state.cartData) return 0
    return state.cartData.items.reduce((total, item) => {
      const quantity = state.cartItems[item.productId] || item.quantity
      return total + (item.product.price * quantity)
    }, 0)
  }, [state.cartData, state.cartItems])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' })
    syncQueue.current.clear()
    isUpdatingRef.current.clear()
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }
  }, [])

  const refreshCart = useCallback(async () => {
    dispatch({ type: 'REFRESH_CART' })
    await fetchCartData()
  }, [fetchCartData])

  const isItemUpdating = useCallback((productId: number) => {
    return isUpdatingRef.current.has(productId)
  }, [])

  const getItemError = useCallback((productId: number) => {
    return state.updateErrors[productId] || null
  }, [state.updateErrors])

  return (
    <CartContext.Provider value={{
      state,
      fetchCartData,
      updateItemQuantity,
      removeItem,
      getTotalCartItems,
      getItemQuantity,
      canAddMore,
      clearCart,
      getTotalPrice,
      isItemUpdating,
      refreshCart,
      getItemError,
      validateCartStock,
      refreshProducts,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export default CartProvider