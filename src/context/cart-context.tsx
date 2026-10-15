"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useToast } from "@/components/ui/toast";
import type { CartLineView, CartSummary, CartView } from "@/lib/cart/cart";

interface CartContextValue {
  cart: CartView | null;
  itemCount: number;
  isLoading: boolean;
  isMutating: boolean;
  addItem: (variantId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (variantId: string, quantity: number) => Promise<boolean>;
  removeItem: (variantId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
  isSignedIn: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function ClerkAuthBridge({
  onChange,
}: {
  onChange: (state: { isSignedIn: boolean; isLoaded: boolean }) => void;
}) {
  const { isSignedIn, isLoaded } = useAuth();
  useEffect(() => {
    onChange({ isSignedIn: Boolean(isSignedIn), isLoaded: Boolean(isLoaded) });
  }, [isSignedIn, isLoaded, onChange]);
  return null;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [authState, setAuthState] = useState<{ isSignedIn: boolean; isLoaded: boolean }>({
    isSignedIn: !HAS_CLERK,
    isLoaded: !HAS_CLERK,
  });

  const [cart, setCart] = useState<CartView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  // Prevent duplicate execution of post-login add parameter
  const processedAddParamRef = useRef<string | null>(null);

  const fetchCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/cart", {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (res.status === 200) {
        const data = await res.json();
        setCart(data);
      } else if (res.status === 401) {
        setCart(null);
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // When auth changes or mounts
  useEffect(() => {
    if (authState.isSignedIn) {
      fetchCart();
    } else if (authState.isLoaded) {
      setCart(null);
      setIsLoading(false);
    }
  }, [authState.isSignedIn, authState.isLoaded, fetchCart]);

  const addItem = useCallback(
    async (variantId: string, quantity = 1): Promise<boolean> => {
      setIsMutating(true);
      try {
        const res = await fetch("/api/cart/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId, quantity }),
        });

        if (res.status === 401) {
          // Unauthenticated redirect per rule:
          // /sign-in?redirect_url=<current-page>&add=<variantId>:<quantity>
          const returnUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
          const target = `/sign-in?redirect_url=${encodeURIComponent(returnUrl)}&add=${encodeURIComponent(`${variantId}:${quantity}`)}`;
          router.push(target);
          return false;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          const errorMsg = body?.error?.message || "Could not add item to cart. Please try again.";
          showToast(errorMsg, "error");
          return false;
        }

        const updatedCart: CartView = await res.json();
        setCart(updatedCart);
        showToast("Added to cart", "success");
        return true;
      } catch (err) {
        console.error("Add item error:", err);
        showToast("Something went wrong. Please check your connection.", "error");
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [pathname, searchParams, router, showToast]
  );

  const updateQuantity = useCallback(
    async (variantId: string, quantity: number): Promise<boolean> => {
      setIsMutating(true);
      try {
        const res = await fetch(`/api/cart/items/${variantId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          const errorMsg = body?.error?.message || "Could not update quantity.";
          showToast(errorMsg, "error");
          // Reconcile with server
          await fetchCart();
          return false;
        }

        const updatedCart: CartView = await res.json();
        setCart(updatedCart);
        return true;
      } catch (err) {
        console.error("Update quantity error:", err);
        showToast("Network error. Please try again.", "error");
        await fetchCart();
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [fetchCart, showToast]
  );

  const removeItem = useCallback(
    async (variantId: string): Promise<boolean> => {
      setIsMutating(true);
      try {
        const res = await fetch(`/api/cart/items/${variantId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          showToast("Could not remove item. Please try again.", "error");
          await fetchCart();
          return false;
        }

        const updatedCart: CartView = await res.json();
        setCart(updatedCart);
        showToast("Item removed from cart", "info");
        return true;
      } catch (err) {
        console.error("Remove item error:", err);
        showToast("Network error. Please try again.", "error");
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [fetchCart, showToast]
  );

  const clearCart = useCallback(async (): Promise<boolean> => {
    setIsMutating(true);
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        showToast("Could not clear cart.", "error");
        return false;
      }

      const updatedCart: CartView = await res.json();
      setCart(updatedCart);
      showToast("Cart cleared", "info");
      return true;
    } catch (err) {
      console.error("Clear cart error:", err);
      showToast("Network error. Please try again.", "error");
      return false;
    } finally {
      setIsMutating(false);
    }
  }, [showToast]);

  // Handle post-login ?add=variantId:quantity parameter
  useEffect(() => {
    const addParam = searchParams.get("add");
    if (!addParam || !authState.isSignedIn) return;

    // Ensure it runs exactly once per parameter value
    if (processedAddParamRef.current === addParam) return;
    processedAddParamRef.current = addParam;

    const [vId, qtyStr] = addParam.split(":");
    const qty = parseInt(qtyStr || "1", 10);
    if (!vId) return;

    (async () => {
      const success = await addItem(vId, isNaN(qty) ? 1 : qty);
      if (success) {
        // Strip ?add=... from query params cleanly using router.replace
        const params = new URLSearchParams(searchParams.toString());
        params.delete("add");
        const newQuery = params.toString();
        const cleanPath = pathname + (newQuery ? `?${newQuery}` : "");
        router.replace(cleanPath);
      }
    })();
  }, [searchParams, authState.isSignedIn, addItem, pathname, router]);

  const itemCount = cart?.summary.totalQuantity ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        isLoading,
        isMutating,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart: fetchCart,
        isSignedIn: authState.isSignedIn,
      }}
    >
      {HAS_CLERK && <ClerkAuthBridge onChange={setAuthState} />}
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
