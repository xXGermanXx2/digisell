import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";

function storageKey(shopSlug?: string) {
  return shopSlug ? `digisell:shop-buyer:${shopSlug}` : "digisell:shop-buyer";
}

export function useShopBuyerAuth(shopSlug?: string) {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | undefined>(() => {
    if (typeof window === "undefined" || !shopSlug) return undefined;
    return window.localStorage.getItem(storageKey(shopSlug)) || undefined;
  });

  useEffect(() => {
    if (!shopSlug || typeof window === "undefined") return;
    setToken(window.localStorage.getItem(storageKey(shopSlug)) || undefined);
  }, [shopSlug]);

  const me = trpc.shopBuyerAuth.me.useQuery(
    { shopSlug: shopSlug ?? "", token },
    { enabled: !!shopSlug && !!token, retry: false }
  );
  const logoutMutation = trpc.shopBuyerAuth.logout.useMutation();

  const saveToken = (nextToken: string) => {
    if (!shopSlug || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey(shopSlug), nextToken);
    setToken(nextToken);
  };

  const clearToken = async () => {
    if (!shopSlug) return;
    const currentToken = token;
    if (typeof window !== "undefined") window.localStorage.removeItem(storageKey(shopSlug));
    setToken(undefined);
    if (currentToken) await logoutMutation.mutateAsync({ shopSlug, token: currentToken });
    navigate(`/store/${shopSlug}`);
  };

  return useMemo(() => ({
    token,
    buyer: me.data?.buyer ?? null,
    isShopBuyerAuthenticated: !!me.data?.buyer,
    isLoading: me.isLoading,
    saveToken,
    clearToken,
    refetch: me.refetch,
  }), [token, me.data?.buyer, me.isLoading]);
}
