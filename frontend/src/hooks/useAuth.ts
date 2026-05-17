/** Authentication hook */
import { useState, useEffect, useCallback } from "react";
import * as authApi from "@/lib/api";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id: string; email: string; name: string } | null;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  const getProfile = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setState((s) => ({ ...s, isAuthenticated: false, user: null }));
      return null;
    }

    const user = (await authApi.getProfile()) as AuthState["user"];
    setState((s) => ({
      ...s,
      isAuthenticated: true,
      user,
    }));
    return user;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      (async () => {
        try {
          await getProfile();
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          setState((prev) => ({ ...prev, isAuthenticated: false, user: null }));
        } finally {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      })();
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [getProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const response = (await authApi.login(email, password)) as unknown as AuthResponse;
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("refresh_token", response.refresh_token);

      // attempt to fetch user profile after login; fall back to null
      let user = null;
      try {
        user = await getProfile();
      } catch (e) {
        // ignore profile fetch errors
        user = null;
      }

      setState({
        isAuthenticated: true,
        isLoading: false,
        user,
      });

      return response;
    } catch (err) {
      // ensure loading flag cleared on error
      setState((s) => ({ ...s, isLoading: false }));
      throw err;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const response = (await authApi.register(email, password, name)) as unknown as AuthResponse;
    localStorage.setItem("access_token", response.access_token);
    localStorage.setItem("refresh_token", response.refresh_token);

    let user = null;
    try {
      user = await getProfile();
    } catch {
      user = null;
    }

    setState({
      isAuthenticated: true,
      isLoading: false,
      user,
    });
    return response;
  }, [getProfile]);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });
  }, []);

  return {
    ...state,
    getProfile,
    login,
    register,
    logout,
  };
}

