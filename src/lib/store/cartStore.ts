import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  unit: string;
  image: string;
  storeId: string;
  storeName: string;
  quantity: number;
  stock: number;
  organic?: boolean;
}

export interface StoreGroup {
  storeId: string;
  storeName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
}

interface CartStore {
  items: CartItem[];
  tipAmount: number;
  deliveryWindow: string;
  deliveryInstructions: string;
  
  // Actions
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setTipAmount: (amount: number) => void;
  setDeliveryWindow: (window: string) => void;
  setDeliveryInstructions: (instructions: string) => void;

  // Computed getters
  getItemsCount: () => number;
  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getServiceFee: () => number;
  getTotal: () => number;
  getStoreGroups: () => StoreGroup[];
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [
        {
          id: "prod-1",
          name: "Organic Honeycrisp Apples",
          price: 4.99,
          originalPrice: 5.99,
          unit: "1 lb bag",
          image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80",
          storeId: "store-1",
          storeName: "Valley Green Grocers",
          quantity: 2,
          stock: 45,
          organic: true,
        },
        {
          id: "prod-2",
          name: "Organic Whole Milk",
          price: 5.49,
          unit: "1 Gallon",
          image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80",
          storeId: "store-2",
          storeName: "Sunrise Dairy & Organic",
          quantity: 1,
          stock: 28,
          organic: true,
        },
        {
          id: "prod-3",
          name: "Artisan Sourdough Loaf",
          price: 6.25,
          unit: "Fresh Loaf",
          image: "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=400&q=80",
          storeId: "store-3",
          storeName: "Golden Harvest Market",
          quantity: 1,
          stock: 12,
          organic: false,
        },
      ],
      tipAmount: 3.0,
      deliveryWindow: "Today, 4:00 PM – 6:00 PM",
      deliveryInstructions: "Leave on the front porch table. Ring doorbell.",

      addItem: (newItem) => {
        const qty = newItem.quantity || 1;
        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.id === newItem.id);
          if (existingIndex > -1) {
            const updated = [...state.items];
            const currentQty = updated[existingIndex].quantity;
            const newQty = Math.min(currentQty + qty, newItem.stock || 99);
            updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
            return { items: updated };
          }
          return {
            items: [...state.items, { ...newItem, quantity: qty }],
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.min(quantity, i.stock || 99) } : i
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      setTipAmount: (tipAmount) => set({ tipAmount }),
      setDeliveryWindow: (deliveryWindow) => set({ deliveryWindow }),
      setDeliveryInstructions: (deliveryInstructions) => set({ deliveryInstructions }),

      getItemsCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        const raw = get().items.reduce((total, item) => total + item.price * item.quantity, 0);
        return Math.round(raw * 100) / 100;
      },

      getDeliveryFee: () => {
        const groups = get().getStoreGroups();
        if (groups.length === 0) return 0;
        // $2.99 base fee + $1.50 per additional store
        const fee = 2.99 + Math.max(0, groups.length - 1) * 1.5;
        return Math.round(fee * 100) / 100;
      },

      getServiceFee: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        // 5% standard marketplace platform service fee
        return Math.round(subtotal * 0.05 * 100) / 100;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        const deliveryFee = get().getDeliveryFee();
        const serviceFee = get().getServiceFee();
        const tip = get().tipAmount || 0;
        return Math.round((subtotal + deliveryFee + serviceFee + tip) * 100) / 100;
      },

      getStoreGroups: () => {
        const items = get().items;
        const groupsMap = new Map<string, StoreGroup>();

        items.forEach((item) => {
          if (!groupsMap.has(item.storeId)) {
            groupsMap.set(item.storeId, {
              storeId: item.storeId,
              storeName: item.storeName,
              items: [],
              subtotal: 0,
              deliveryFee: 2.99,
            });
          }
          const group = groupsMap.get(item.storeId)!;
          group.items.push(item);
          group.subtotal = Math.round((group.subtotal + item.price * item.quantity) * 100) / 100;
        });

        return Array.from(groupsMap.values());
      },
    }),
    {
      name: "freshmart_cart_storage",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : {
        getItem: () => null,
        setItem: () => null,
        removeItem: () => null,
      })),
    }
  )
);
