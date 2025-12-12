"use client";

import { createContext, useContext, useEffect, useReducer } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  size?: string;
  color?: string;
};

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: "ADD"; payload: CartItem }
  | { type: "REMOVE"; payload: { id: string; size?: string; color?: string } }
  | { type: "UPDATE_QTY"; payload: { id: string; size?: string; color?: string; quantity: number } }
  | { type: "RESET" };

const STORAGE_KEY = "clothing-store-cart";

const CartContext = createContext<{
  state: CartState;
  addItem: (item: CartItem) => void;
  removeItem: (id: string, size?: string, color?: string) => void;
  updateQuantity: (id: string, quantity: number, size?: string, color?: string) => void;
  clear: () => void;
}>({
  state: { items: [] },
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clear: () => {},
});

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      // Create unique key based on id, size, and color
      const itemKey = `${action.payload.id}-${action.payload.size || ''}-${action.payload.color || ''}`;
      const existing = state.items.find((i) => {
        const existingKey = `${i.id}-${i.size || ''}-${i.color || ''}`;
        return existingKey === itemKey;
      });
      if (existing) {
        const existingKey = `${existing.id}-${existing.size || ''}-${existing.color || ''}`;
        return {
          items: state.items.map((i) => {
            const iKey = `${i.id}-${i.size || ''}-${i.color || ''}`;
            return iKey === existingKey
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i;
          }),
        };
      }
      return { items: [...state.items, action.payload] };
    }
    case "REMOVE": {
      const removeKey = `${action.payload.id}-${action.payload.size || ''}-${action.payload.color || ''}`;
      return {
        items: state.items.filter((i) => {
          const iKey = `${i.id}-${i.size || ''}-${i.color || ''}`;
          return iKey !== removeKey;
        }),
      };
    }
    case "UPDATE_QTY": {
      const updateKey = `${action.payload.id}-${action.payload.size || ''}-${action.payload.color || ''}`;
      return {
        items: state.items.map((i) => {
          const iKey = `${i.id}-${i.size || ''}-${i.color || ''}`;
          return iKey === updateKey
            ? { ...i, quantity: Math.max(1, action.payload.quantity) }
            : i;
        }),
      };
    }
    case "RESET":
      return { items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CartState;
        if (parsed.items) {
          dispatch({ type: "RESET" });
          parsed.items.forEach((item) =>
            dispatch({ type: "ADD", payload: item })
          );
        }
      } catch {
        // ignore broken storage
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addItem = (item: CartItem) => dispatch({ type: "ADD", payload: item });
  const removeItem = (id: string, size?: string, color?: string) =>
    dispatch({ type: "REMOVE", payload: { id, size, color } });
  const updateQuantity = (id: string, quantity: number, size?: string, color?: string) =>
    dispatch({ type: "UPDATE_QTY", payload: { id, quantity, size, color } });
  const clear = () => dispatch({ type: "RESET" });

  return (
    <CartContext.Provider
      value={{ state, addItem, removeItem, updateQuantity, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}

