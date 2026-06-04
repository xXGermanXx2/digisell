import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { trpc } from "@/providers/trpc";

interface CartContextType {
  sessionId: string;
  itemCount: number;
  refreshCart: () => void;
}

const CartContext = createContext<CartContextType>({
  sessionId: "",
  itemCount: 0,
  refreshCart: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [sessionId] = useState<string>(() => {
    const existing = localStorage.getItem("cart_session_id");
    if (existing) return existing;
    const newId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("cart_session_id", newId);
    return newId;
  });

  const { data, refetch } = trpc.cart.get.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );

  const refreshCart = useCallback(() => {
    refetch();
  }, [refetch]);

  const itemCount = data?.count ?? 0;

  return (
    <CartContext.Provider value={{ sessionId, itemCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
