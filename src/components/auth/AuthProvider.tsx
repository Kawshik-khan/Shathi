"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { useAuthStore, useDashboardStore } from "@/lib/store";

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <AuthSessionBridge />
      {children}
    </SessionProvider>
  );
}

function AuthSessionBridge() {
  const { data: session, status } = useSession();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    if (status !== "authenticated" || isAuthenticated) {
      return;
    }

    if (!session?.backendToken || !session.backendRefreshToken || !session.backendUser) {
      return;
    }

    login(session.backendUser, {
      access_token: session.backendToken,
      refresh_token: session.backendRefreshToken,
      token_type: "bearer",
      expires_in: session.backendExpiresIn ?? 1800,
    });
    useDashboardStore.getState().setUser(session.backendUser);
  }, [isAuthenticated, login, session, status]);

  return null;
}
