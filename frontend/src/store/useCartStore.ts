import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  cartItemId: string; 
  productId: number;
  name: string;
  price: number;
  imageUrl?: string | null;
  size: string; // 'S' | 'M' | 'L'
  topping?: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'cartItemId'>) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, qty: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (newItem) => {
        set((state) => {
          // Phân biệt các dòng trong giỏ dựa trên productId, size và topping
          const cartItemId = `${newItem.productId}-${newItem.size}-${newItem.topping || 'none'}`;
          
          const existingIndex = state.items.findIndex(
            (item) => item.cartItemId === cartItemId
          );

          if (existingIndex > -1) {
            // Nếu đã tồn tại đúng món với cùng size và topping thì tăng số lượng lên
            const updatedItems = [...state.items];
            updatedItems[existingIndex].qty += newItem.qty;
            return { items: updatedItems };
          } else {
            // Nếu chưa có thì thêm dòng mới hoàn toàn
            return { items: [...state.items, { ...newItem, cartItemId }] };
          }
        });
      },

      removeFromCart: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.cartItemId !== cartItemId),
        }));
      },

      updateQuantity: (cartItemId, qty) => {
        set((state) => {
          if (qty <= 0) {
            return {
              items: state.items.filter((item) => item.cartItemId !== cartItemId),
            };
          }
          return {
            items: state.items.map((item) =>
              item.cartItemId === cartItemId ? { ...item, qty } : item
            ),
          };
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.qty, 0);
      },

      getTotalAmount: () => {
        return get().items.reduce((total, item) => total + item.price * item.qty, 0);
      },
    }),
    {
      name: 'brewlite-cart-storage', 
    }
  )
);