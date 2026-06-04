import { trpc } from "@/providers/trpc";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { LOGIN_PATH } from "@/const";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } =
    options ?? {};

  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navigate(redirectPath);
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  // Nur weiterleiten wenn isLoading abgeschlossen und kein User vorhanden
  useEffect(() => {
    if (redirectOnUnauthenticated && !isLoading && !user) {
      const currentPath = window.location.pathname;
      if (currentPath !== redirectPath) {
        navigate(redirectPath);
      }
    }
  }, [redirectOnUnauthenticated, isLoading, user, navigate, redirectPath]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      // isLoading nur während der ersten Anfrage (nicht beim Hintergrund-Refetch)
      isLoading: isLoading || logoutMutation.isPending,
      error,
      logout,
      refresh: refetch,
    }),
    [user, isLoading, logoutMutation.isPending, error, logout, refetch],
  );
}
