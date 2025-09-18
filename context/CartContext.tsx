import React, { createContext, useContext, useReducer, useRef, useCallback } from 'react'
import { apiRequest } from '../utils/api'
import Toast from 'react-native-toast-message'

// Types (keeping existing types)
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
  cartItems: { [key: number]: number };
  loading: boolean;
  error: string | null;
  syncInProgress: boolean;
  updateErrors: { [key: number]: string };
  // Track last successful sync quantities to prevent override
  lastSyncedQuantities: { [key: number]: number };
  // Track original server quantities for better sync management
  serverQuantities: { [key: number]: number };
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CART_DATA'; payload: CartData | null }
  | { type: 'SET_CART_ITEMS'; payload: { [key: number]: number } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_ITEM_QUANTITY'; payload: { productId: number; quantity: number; product?: CartProduct } }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'SET_SYNC_IN_PROGRESS'; payload: boolean }
  | { type: 'SET_UPDATE_ERROR'; payload: { productId: number; error: string | null } }
  | { type: 'CLEAR_CART' }
  | { type: 'REFRESH_CART' }
  | { type: 'SYNC_SUCCESS'; payload: { productId: number; actualQuantity: number } }
  | { type: 'UPDATE_LAST_SYNCED'; payload: { [key: number]: number } }
  | { type: 'OPTIMISTIC_UPDATE'; payload: { productId: number; quantity: number } }
  | { type: 'SET_SERVER_QUANTITIES'; payload: { [key: number]: number } }
  | { type: 'REVERT_ITEM'; payload: { productId: number; quantity: number } }

const initialState: CartState = {
  cartData: null,
  cartItems: {},
  loading: false,
  error: null,
  syncInProgress: false,
  updateErrors: {},
  lastSyncedQuantities: {},
  serverQuantities: {},
}

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_CART_DATA':
      return { ...state, cartData: action.payload }

    case 'SET_CART_ITEMS':
      // When setting cart items from server, also update server quantities
      return {
        ...state,
        cartItems: action.payload,
        lastSyncedQuantities: { ...action.payload },
        serverQuantities: { ...action.payload }
      }

    case 'SET_SERVER_QUANTITIES':
      return { ...state, serverQuantities: action.payload }

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

    case 'UPDATE_LAST_SYNCED':
      return {
        ...state,
        lastSyncedQuantities: { ...state.lastSyncedQuantities, ...action.payload }
      }

    case 'OPTIMISTIC_UPDATE':
      const updatedCartItems = { ...state.cartItems }
      if (action.payload.quantity <= 0) {
        delete updatedCartItems[action.payload.productId]
      } else {
        updatedCartItems[action.payload.productId] = action.payload.quantity
      }
      return { ...state, cartItems: updatedCartItems }

    case 'REVERT_ITEM':
      const revertedCartItems = { ...state.cartItems }
      if (action.payload.quantity <= 0) {
        delete revertedCartItems[action.payload.productId]
      } else {
        revertedCartItems[action.payload.productId] = action.payload.quantity
      }
      return { ...state, cartItems: revertedCartItems }

    case 'SYNC_SUCCESS':
      const serverQuantity = action.payload.actualQuantity
      const finalUpdatedCartItems = { ...state.cartItems }

      if (serverQuantity <= 0) {
        delete finalUpdatedCartItems[action.payload.productId]
      } else {
        finalUpdatedCartItems[action.payload.productId] = serverQuantity
      }

      // Update cartData with the actual server quantity
      let updatedCartData = state.cartData
      if (updatedCartData) {
        const existingItemIndex = updatedCartData.items.findIndex(
          item => item.productId === action.payload.productId
        )

        if (existingItemIndex >= 0) {
          if (serverQuantity <= 0) {
            updatedCartData = {
              ...updatedCartData,
              items: updatedCartData.items.filter(item => item.productId !== action.payload.productId)
            }
          } else {
            updatedCartData = {
              ...updatedCartData,
              items: updatedCartData.items.map(item =>
                item.productId === action.payload.productId
                  ? { ...item, quantity: serverQuantity }
                  : item
              )
            }
          }
        }
      }

      return {
        ...state,
        cartItems: finalUpdatedCartItems,
        cartData: updatedCartData,
        lastSyncedQuantities: {
          ...state.lastSyncedQuantities,
          [action.payload.productId]: serverQuantity
        },
        serverQuantities: {
          ...state.serverQuantities,
          [action.payload.productId]: serverQuantity
        }
      }

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
            newCartData = {
              ...newCartData,
              items: newCartData.items.filter(item => item.productId !== productId)
            }
          } else {
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

      const filteredLastSynced = { ...state.lastSyncedQuantities }
      delete filteredLastSynced[action.payload]

      const filteredServerQuantities = { ...state.serverQuantities }
      delete filteredServerQuantities[action.payload]

      const filteredCartData = state.cartData ? {
        ...state.cartData,
        items: state.cartData.items.filter(item => item.productId !== action.payload)
      } : null

      return {
        ...state,
        cartItems: filteredCartItems,
        cartData: filteredCartData,
        lastSyncedQuantities: filteredLastSynced,
        serverQuantities: filteredServerQuantities
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
        lastSyncedQuantities: {},
        serverQuantities: {},
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
  updateItemQuantity: (productId: number, change: number, product?: CartProduct) => Promise<boolean>;
  removeItem: (productId: number) => Promise<void>;
  getTotalCartItems: () => number;
  getItemQuantity: (productId: number) => number;
  canAddMore: (productId: number, product?: CartProduct) => boolean;
  clearCart: () => void;
  getTotalPrice: () => number;
  isItemUpdating: (productId: number) => boolean;
  refreshCart: () => Promise<void>;
  getItemError: (productId: number) => string | null;
  validateCartStock: () => Promise<boolean>;
  refreshProducts: () => Promise<void>;
  getAvailableStock: (product: CartProduct) => number;
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

  // Improved sync queue management with locking mechanism
  const syncQueue = useRef<Map<number, {
    oldQuantity: number;
    newQuantity: number;
    product?: CartProduct;
    timestamp: number
  }>>(new Map())
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUpdatingRef = useRef<Set<number>>(new Set())
  const lastSyncRef = useRef<number>(0)
  const syncLockRef = useRef<boolean>(false)

  const fetchCartData = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const response = await apiRequest('/customer/outlets/get-cart', {
        method: 'GET'
      })

      // console.log('🔄 Cart data fetched:', response)

      if (response.cart) {
        dispatch({ type: 'SET_CART_DATA', payload: response.cart })

        // Convert to cartItems format - This is the single source of truth
        const cartMap: { [key: number]: number } = {}
        response.cart.items.forEach((item: CartItem) => {
          cartMap[item.productId] = item.quantity
        })
        dispatch({ type: 'SET_CART_ITEMS', payload: cartMap })
      } else {
        dispatch({ type: 'SET_CART_DATA', payload: null })
        dispatch({ type: 'SET_CART_ITEMS', payload: {} })
      }
    } catch (error) {
      console.error('❌ Error fetching cart:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch cart data' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  // Consistent stock calculation method
  const getAvailableStock = useCallback((product: CartProduct): number => {
    if (!product.inventory) return 999 // No inventory tracking

    const totalStock = product.inventory.quantity || 0
    const reservedStock = product.inventory.reserved || 0
    const currentQuantityInCart = state.cartItems[product.id] || 0

    // Available stock = total - reserved - current cart quantity
    return Math.max(0, totalStock - reservedStock - currentQuantityInCart)
  }, [state.cartItems])

  // Enhanced stock validation
  const validateStockForAddition = useCallback((product: CartProduct, additionalQuantity: number): boolean => {
    const availableStock = getAvailableStock(product)

    // console.log(`📊 Stock validation for ${product.name}:`, {
    //   additionalQuantity,
    //   availableStock,
    //   canAdd: additionalQuantity <= availableStock
    // })

    return additionalQuantity <= availableStock
  }, [getAvailableStock])

  // Robust sync process with proper locking
  const syncPendingChanges = useCallback(async () => {
    if (syncQueue.current.size === 0 || state.syncInProgress || syncLockRef.current) {
      return
    }

    const syncId = Date.now()
    lastSyncRef.current = syncId
    syncLockRef.current = true

    // console.log(`🔄 Starting sync #${syncId} with ${syncQueue.current.size} items`)

    dispatch({ type: 'SET_SYNC_IN_PROGRESS', payload: true })

    try {
      // Process each item in the queue
      for (const [productId, { oldQuantity, newQuantity, product, timestamp }] of syncQueue.current.entries()) {
        try {
          // Skip if there's a newer change in the queue
          const currentQueueItem = syncQueue.current.get(productId)
          if (!currentQueueItem || currentQueueItem.timestamp > timestamp) {
            continue
          }

          dispatch({ type: 'SET_UPDATE_ERROR', payload: { productId, error: null } })

          // console.log(`📦 Syncing product ${productId}: ${oldQuantity} → ${newQuantity}`)

          if (newQuantity === 0) {
            // Remove all items
            if (oldQuantity > 0) {
              await apiRequest('/customer/outlets/update-cart-item', {
                method: 'PUT',
                body: {
                  productId: productId,
                  quantity: oldQuantity,
                  action: 'remove'
                }
              })
            }
          } else if (oldQuantity === 0) {
            // Validate stock before adding new items
            if (product && !validateStockForAddition(product, newQuantity)) {
              const availableStock = getAvailableStock(product)

              dispatch({
                type: 'SET_UPDATE_ERROR',
                payload: {
                  productId,
                  error: `Only ${availableStock} items available`
                }
              })

              // Revert to 0 quantity
              dispatch({ type: 'REVERT_ITEM', payload: { productId, quantity: 0 } })

              Toast.show({
                type: 'error',
                text1: 'Stock Limit',
                text2: `Only ${availableStock} ${product.name} available in stock`,
                position: 'top',
                topOffset: 200,
                visibilityTime: 3000,
                autoHide: true,
              })

              syncQueue.current.delete(productId)
              continue
            }

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
            // Adding more items
            const addQuantity = newQuantity - oldQuantity

            if (product && !validateStockForAddition(product, addQuantity)) {
              const availableStock = getAvailableStock(product)

              dispatch({
                type: 'SET_UPDATE_ERROR',
                payload: {
                  productId,
                  error: `Only ${availableStock} more items available`
                }
              })

              // Revert to old quantity
              dispatch({ type: 'REVERT_ITEM', payload: { productId, quantity: oldQuantity } })

              Toast.show({
                type: 'error',
                text1: 'Stock Limit',
                text2: `Only ${availableStock} more ${product.name} available`,
                position: 'top',
                topOffset: 200,
                visibilityTime: 3000,
                autoHide: true,
              })

              syncQueue.current.delete(productId)
              continue
            }

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

          // Update server quantities on successful sync
          dispatch({
            type: 'UPDATE_LAST_SYNCED',
            payload: { [productId]: newQuantity }
          })

          // console.log(`✅ Successfully synced product ${productId} to ${newQuantity}`)

        } catch (error: any) {
          console.error(`❌ Error syncing item ${productId}:`, error)

          // Handle specific stock errors and revert changes
          if (error.message?.includes('stock') || error.message?.includes('inventory')) {
            const serverQuantity = state.serverQuantities[productId] || 0

            dispatch({
              type: 'SET_UPDATE_ERROR',
              payload: {
                productId,
                error: 'Stock limit reached'
              }
            })

            // Revert to last known server quantity
            dispatch({ type: 'REVERT_ITEM', payload: { productId, quantity: serverQuantity } })

            // Refresh cart to get current stock info
            await fetchCartData()
          } else {
            dispatch({
              type: 'SET_UPDATE_ERROR',
              payload: {
                productId,
                error: 'Sync failed - retrying...'
              }
            })

            // For network errors, keep the change in queue for retry
            continue
          }
        }
      }

      // Clear successfully processed items
      syncQueue.current.clear()
      // console.log(`✅ Sync #${syncId} completed`)

    } catch (error) {
      console.error(`❌ Sync #${syncId} failed:`, error)
    } finally {
      // Only clear sync flag if this is still the latest sync
      if (lastSyncRef.current === syncId) {
        dispatch({ type: 'SET_SYNC_IN_PROGRESS', payload: false })
        syncLockRef.current = false
      }
    }
  }, [state.syncInProgress, state.serverQuantities, validateStockForAddition, getAvailableStock, fetchCartData])

  // Much improved updateItemQuantity with better race condition handling
  const updateItemQuantity = useCallback(async (productId: number, change: number, product?: CartProduct): Promise<boolean> => {
    // This is to prevent the double-firing issue. If an update is already in the queue, ignore subsequent calls for a very short time.
    if (isUpdatingRef.current.has(productId)) {
      return false
    }

    const currentQuantity = state.cartItems[productId] || 0
    const newQuantity = Math.max(0, currentQuantity + change)

    // console.log(`🔄 Updating quantity for product ${productId}: ${currentQuantity} + ${change} = ${newQuantity}`)

    // Don't allow negative quantities
    if (newQuantity < 0) return false

    // For additions, validate stock
    if (change > 0 && product) {
      // This client-side validation remains as a good first-pass check
      if (!validateStockForAddition(product, change)) {
        const availableStock = getAvailableStock(product)

        Toast.show({
          type: 'error',
          text1: 'Stock Limit',
          text2: `Only ${availableStock} ${product.name} available`,
          position: 'top',
          topOffset: 200,
          visibilityTime: 3000,
          autoHide: true,
        })

        return false
      }
    }

    // Clear any existing errors
    dispatch({ type: 'SET_UPDATE_ERROR', payload: { productId, error: null } })

    // Lock this item briefly
    isUpdatingRef.current.add(productId)

    // INSTANT UI UPDATE using optimistic update
    dispatch({ type: 'OPTIMISTIC_UPDATE', payload: { productId, quantity: newQuantity } })

    // Add to sync queue with the final target quantity
    syncQueue.current.set(productId, {
      oldQuantity: state.lastSyncedQuantities[productId] || 0, // This is the crucial change
      newQuantity,
      product,
      timestamp: Date.now()
    })

    // console.log(`📝 Added to sync queue: ${productId} → ${newQuantity}`)

    // Debounced background sync - reduced timeout for better UX
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await syncPendingChanges()
      } finally {
        // Unlock after the sync process is triggered
        isUpdatingRef.current.delete(productId)
      }
    }, 500) // Reduced from 800ms to 500ms for better responsiveness

    return true
  }, [state.cartItems, state.lastSyncedQuantities, syncPendingChanges, validateStockForAddition, getAvailableStock])

  const canAddMore = useCallback((productId: number, product?: CartProduct) => {
    if (!product) return false

    const availableStock = getAvailableStock(product)
    return availableStock > 0
  }, [getAvailableStock])

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
      await fetchCartData() // Refresh cart to get latest product data
    } catch (error) {
      console.error('Error refreshing products:', error)
    }
  }, [fetchCartData])

  const removeItem = useCallback(async (productId: number) => {
    // console.log(`🗑️ Removing item ${productId}`)

    // Clear any existing errors
    dispatch({ type: 'SET_UPDATE_ERROR', payload: { productId, error: null } })

    // INSTANT UI UPDATE
    dispatch({ type: 'REMOVE_ITEM', payload: productId })

    // Remove from sync queue if present
    syncQueue.current.delete(productId)

    // Immediate sync for removals (don't queue)
    try {
      const currentQuantity = state.serverQuantities[productId] || state.cartItems[productId] || 0
      if (currentQuantity > 0) {
        await apiRequest('/customer/outlets/update-cart-item', {
          method: 'PUT',
          body: {
            productId: productId,
            quantity: currentQuantity,
            action: 'remove'
          }
        })
      }
      // console.log(`✅ Item ${productId} removed successfully`)
    } catch (error) {
      console.error(`❌ Error removing item ${productId}:`, error)
      // Refresh cart on error to get correct state
      await fetchCartData()
    }
  }, [state.cartItems, state.serverQuantities, fetchCartData])

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
    // console.log('🧹 Clearing cart')
    dispatch({ type: 'CLEAR_CART' })
    syncQueue.current.clear()
    isUpdatingRef.current.clear()
    syncLockRef.current = false
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }
  }, [])

  const refreshCart = useCallback(async () => {
    // console.log('🔄 Refreshing cart')
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
      getAvailableStock,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export default CartProvider