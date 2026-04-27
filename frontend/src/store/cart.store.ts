import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    slug: string;
    images: { url: string }[];
    inventory: { quantity: number };
  };
  variant?: { name: string } | null;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  setCart: (cart: { items: CartItem[]; subtotal: number; itemCount: number }) => void;
  clearLocalCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      subtotal: 0,
      itemCount: 0,
      setCart: (cart) => set(cart),
      clearLocalCart: () => set({ items: [], subtotal: 0, itemCount: 0 }),
    }),
    { name: 'lagaao-cart' },
  ),
);
