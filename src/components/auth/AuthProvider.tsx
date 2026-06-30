"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { useAuthStore, useDashboardStore } from "@/lib/store";
import { apiFetch } from "@/lib/api";

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
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (status !== "authenticated" || isAuthenticated) {
      return;
    }

    // P1 1.3: backendUser carries identity only; the JWT sits in the
    // HttpOnly ``sathi_at`` cookie. After Auth.js sign-in we must
    // confirm the cookie is present and end-to-end valid by hitting a
    // lightweight authenticated endpoint. If it 401s we treat the
    // session as not having backend cookies and fall back to login.
    if (!session.backendUser) {
      return;
    }

    void (async () => {
      try {
        // Probe: any authenticated endpoint works. ``/api/v1/users/me``
        // resolves to ``/api/backend/proxy/api/v1/users/me`` via the BFF.
        await apiFetch("/api/v1/users/me");
        login(session.backendUser!);
        useDashboardStore.getState().setUser(session.backendUser!);
      } catch {
        // Cookies are missing — clear the auth bridge state.
        await logout();
      }
    })();
  }, [isAuthenticated, login, logout, session, status]);

  return null;
}
