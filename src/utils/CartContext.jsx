// src/utils/CartContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Provider del carrito. Cambios respecto a versiones anteriores:
//   - Carritos SEPARADOS por tienda (jewelry vs general) usando keys distintas
//   - Límite de 50 items por carrito (para no romper WhatsApp con pedidos enormes)
//   - Cantidad máxima por item: 99
//   - Items ordenados por más reciente arriba (al renderizar)
//   - El nombre del cliente persiste entre tiendas
// ─────────────────────────────────────────────────────────────────────────────
import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getMergeKey, buildProductSnapshot } from './cart';

const MAX_ITEMS_PER_CART = 50;
const MAX_QTY_PER_ITEM   = 99;
const NAME_KEY           = 'benito_cart_customer_name';

const CartCtx = createContext(null);

const initialState = { items: [], customerName: '', open: false, storeKey: 'jewelry' };

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE': {
      return { ...state, ...action.payload };
    }
    case 'ADD': {
      const newItem = action.payload;
      if (state.items.length >= MAX_ITEMS_PER_CART) {
        // No agregar más — el carrito está lleno
        return state;
      }
      const key = getMergeKey(newItem);
      const existIdx = state.items.findIndex(it => getMergeKey(it) === key);
      let next;
      if (existIdx !== -1) {
        next = state.items.map((it, i) =>
          i === existIdx
            ? { ...it, quantity: Math.min(MAX_QTY_PER_ITEM, (parseInt(it.quantity) || 1) + (parseInt(newItem.quantity) || 1)) }
            : it
        );
      } else {
        next = [...state.items, newItem];
      }
      return { ...state, items: next };
    }
    case 'UPDATE_QUANTITY': {
      const { itemId, quantity } = action.payload;
      const q = Math.max(1, Math.min(MAX_QTY_PER_ITEM, parseInt(quantity) || 1));
      return {
        ...state,
        items: state.items.map(it => it.id === itemId ? { ...it, quantity: q } : it),
      };
    }
    case 'UPDATE_ITEM': {
      const { itemId, updates } = action.payload;
      return {
        ...state,
        items: state.items.map(it => it.id === itemId ? { ...it, ...updates } : it),
      };
    }
    case 'REMOVE': {
      return {
        ...state,
        items: state.items.filter(it => it.id !== action.payload.itemId),
      };
    }
    case 'CLEAR': {
      return { ...state, items: [] };
    }
    case 'SET_NAME': {
      return { ...state, customerName: action.payload || '' };
    }
    case 'SET_OPEN': {
      return { ...state, open: !!action.payload };
    }
    case 'SET_STORE_KEY': {
      return { ...state, storeKey: action.payload };
    }
    default:
      return state;
  }
}

/** Detecta la tienda según la URL */
function detectStoreKey(pathname) {
  return (pathname || '').startsWith('/tienda-general') ? 'general' : 'jewelry';
}
function getStorageKey(storeKey) {
  return `benito_cart_${storeKey}`;
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  // Detectar tienda actual desde la URL (puede cambiar)
  let pathname = '/';
  try {
    const loc = useLocation();
    pathname = loc.pathname;
  } catch {}
  const currentStoreKey = detectStoreKey(pathname);

  // Cuando cambia la tienda → cargar el carrito de esa tienda
  useEffect(() => {
    if (state.storeKey === currentStoreKey && state.items.length === 0) {
      // posible primer mount; hidrata
    }
    if (state.storeKey !== currentStoreKey) {
      // Guarda el carrito actual antes de cambiar
      try {
        localStorage.setItem(getStorageKey(state.storeKey), JSON.stringify(state.items));
      } catch {}
    }
    try {
      const raw = localStorage.getItem(getStorageKey(currentStoreKey));
      const name = localStorage.getItem(NAME_KEY) || '';
      const items = raw ? JSON.parse(raw) : [];
      dispatch({
        type: 'HYDRATE',
        payload: {
          items: Array.isArray(items) ? items : [],
          customerName: name,
          storeKey: currentStoreKey,
          open: false,
        },
      });
    } catch {
      dispatch({ type: 'SET_STORE_KEY', payload: currentStoreKey });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStoreKey]);

  // Persistir items en localStorage de la tienda correspondiente
  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(state.storeKey), JSON.stringify(state.items));
    } catch {}
  }, [state.items, state.storeKey]);

  // Persistir nombre del cliente (compartido entre tiendas)
  useEffect(() => {
    try { localStorage.setItem(NAME_KEY, state.customerName || ''); } catch {}
  }, [state.customerName]);

  // ── API pública ──
  const addToCart = useCallback((cartItem) => {
    if (!cartItem) return { ok: false, reason: 'invalid' };
    const itemWithId = {
      ...cartItem,
      id: cartItem.id || `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      addedAt: Date.now(),
    };
    dispatch({ type: 'ADD', payload: itemWithId });
    return { ok: true };
  }, []);

  const updateQuantity = useCallback((itemId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
  }, []);
  const updateItem = useCallback((itemId, updates) => {
    dispatch({ type: 'UPDATE_ITEM', payload: { itemId, updates } });
  }, []);
  const removeFromCart = useCallback((itemId) => {
    dispatch({ type: 'REMOVE', payload: { itemId } });
  }, []);
  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' });
    try { localStorage.removeItem(getStorageKey(state.storeKey)); } catch {}
  }, [state.storeKey]);
  const setCustomerName = useCallback((name) => {
    dispatch({ type: 'SET_NAME', payload: name });
  }, []);
  const setCartOpen = useCallback((open) => {
    dispatch({ type: 'SET_OPEN', payload: open });
  }, []);

  // Items ordenados: más reciente arriba (por addedAt descendente)
  const orderedItems = useMemo(() => {
    return [...state.items].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
  }, [state.items]);

  const value = {
    items: state.items,             // orden interno (para WhatsApp y subscript fns)
    orderedItems,                   // orden para la UI (más reciente arriba)
    customerName: state.customerName,
    open: state.open,
    storeKey: state.storeKey,
    isFull: state.items.length >= MAX_ITEMS_PER_CART,
    maxItems: MAX_ITEMS_PER_CART,
    maxQtyPerItem: MAX_QTY_PER_ITEM,
    addToCart,
    updateQuantity,
    updateItem,
    removeFromCart,
    clearCart,
    setCustomerName,
    setCartOpen,
    buildProductSnapshot,
  };

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) {
    return {
      items: [], orderedItems: [], customerName: '', open: false, storeKey: 'jewelry',
      isFull: false, maxItems: MAX_ITEMS_PER_CART, maxQtyPerItem: MAX_QTY_PER_ITEM,
      addToCart: () => ({ ok: false }), updateQuantity: () => {}, updateItem: () => {},
      removeFromCart: () => {}, clearCart: () => {}, setCustomerName: () => {},
      setCartOpen: () => {}, buildProductSnapshot,
    };
  }
  return ctx;
}