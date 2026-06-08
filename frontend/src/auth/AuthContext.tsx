import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";
import { TOKEN_STORAGE_KEY } from "../api/client";
import type { Role } from "../api/types";

interface AuthUser {
  fullName: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = "fsjes_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token && !user) {
      authApi
        .me()
        .then((profile) => {
          const authUser = { fullName: profile.full_name, role: profile.role };
          setUser(authUser);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string) {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      localStorage.setItem(TOKEN_STORAGE_KEY, res.access_token);
      const authUser = { fullName: res.full_name, role: res.role };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
