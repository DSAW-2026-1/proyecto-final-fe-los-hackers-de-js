import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface CartItem {
  productID: string;
  amount: number;
}

export interface CartData {
  [key: number]: CartItem;
}

interface CartContextType {
  cart: CartData;
  addToCart: (productID: string, amount: number, stock: number) => void;
  removeFromCart: (index: number) => void;
  updateAmount: (index: number, amount: number, stock: number) => void;
  clearCart: () => void;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartData>(() => {
    const savedCart = localStorage.getItem('unisabana_cart');
    return savedCart ? JSON.parse(savedCart) : {};
  });

  useEffect(() => {
    localStorage.setItem('unisabana_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (productID: string, amount: number, stock: number) => {
    setCart(prev => {
      const items = Object.values(prev);
      const existingItemIndex = items.findIndex(item => item.productID === productID);

      if (existingItemIndex !== -1) {
        const existingItem = items[existingItemIndex];
        const newAmount = existingItem.amount + amount;
        
        if (newAmount > stock) {
          toast.error(`Solo hay ${stock} unidades disponibles`);
          return prev;
        }

        const newCart = { ...prev };
        newCart[existingItemIndex] = { ...existingItem, amount: newAmount };
        toast.success('Cantidad actualizada en el carrito');
        return newCart;
      }

      if (amount > stock) {
        toast.error(`Solo hay ${stock} unidades disponibles`);
        return prev;
      }

      const nextIndex = Object.keys(prev).length;
      toast.success('Producto añadido al carrito');
      return {
        ...prev,
        [nextIndex]: { productID, amount }
      };
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => {
      const newItems = Object.values(prev).filter((_, i) => i !== index);
      const newCart: CartData = {};
      newItems.forEach((item, i) => {
        newCart[i] = item;
      });
      return newCart;
    });
    toast.info('Producto eliminado del carrito');
  };

  const updateAmount = (index: number, amount: number, stock: number) => {
    if (amount > stock) {
      toast.error(`Solo hay ${stock} unidades disponibles`);
      return;
    }
    if (amount < 1) return;

    setCart(prev => ({
      ...prev,
      [index]: { ...prev[index], amount }
    }));
  };

  const clearCart = () => {
    setCart({});
  };

  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.amount, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateAmount, clearCart, totalItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
