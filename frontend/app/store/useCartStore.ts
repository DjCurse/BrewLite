import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  cartItemId: string; 
  productId: number;
  name: string;
  size: "S" | "M" | "L";
  toppings: string[];
  basePrice: number;
  unitPrice: number;  
  topping?: string | null;
  qty: number;
  lineTotal: number; 
  imageUrl: string;
};

type AddToCartInput = {
  productId: number;
  name: string;
  size: "S" | "M" | "L";
  toppings: string[];
  basePrice: number;
  unitPrice: number;
  qty?: number;
  imageUrl: string;
};

type CartState = {
  items: CartItem[];
  addToCart: (input: AddToCartInput) => void;
  updateQty: (cartItemId: string, newQty: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (input) => {
        const qtyToAdd = input.qty ?? 1;
        const sortedToppings = [...input.toppings].sort();
        const cartItemId = `${input.productId}-${input.size}-${sortedToppings.join(",")}`;

        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.cartItemId === cartItemId
          );

          // Nếu đã có món trùng hệt ID + Size + Topping -> Cộng dồn số lượng
          if (existingIndex > -1) {
            const updated = [...state.items];
            const current = updated[existingIndex];
            const newQty = current.qty + qtyToAdd;
            updated[existingIndex] = {
              ...current,
              qty: newQty,
              lineTotal: current.unitPrice * newQty,
            };
            return { items: updated };
          }

          // Nếu chưa có -> Thêm dòng mới vào giỏ
          const newItem: CartItem = {
            cartItemId,
            productId: input.productId,
            name: input.name,
            size: input.size,
            toppings: sortedToppings,
            basePrice: input.basePrice,
            unitPrice: input.unitPrice,
            qty: qtyToAdd,
            lineTotal: input.unitPrice * qtyToAdd,
            imageUrl: input.imageUrl,
          };

          return { items: [...state.items, newItem] };
        });
      },

      updateQty: (cartItemId, newQty) => {
        set((state) => {
          // Nếu giảm số lượng về 0 thì xóa khỏi giỏ
          if (newQty <= 0) {
            return {
              items: state.items.filter((item) => item.cartItemId !== cartItemId),
            };
          }
          return {
            items: state.items.map((item) =>
              item.cartItemId === cartItemId
                ? {
                    ...item,
                    qty: newQty,
                    lineTotal: item.unitPrice * newQty,
                  }
                : item
            ),
          };
        });
      },

      removeFromCart: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.cartItemId !== cartItemId),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () =>
        get().items.reduce((sum, item) => sum + item.qty, 0),

      getTotalPrice: () =>
        get().items.reduce((sum, item) => sum + item.lineTotal, 0),
    }),
    {
      name: "brewlite-cart-storage", // Tự động lưu vào localStorage
    }
  )
);