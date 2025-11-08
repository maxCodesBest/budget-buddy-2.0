import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { http, setAccessToken } from "../lib/http";

type User = { id: string; username: string };
type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider(props: { children: any }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Bootstrap: try refresh, then load profile
    (async () => {
      try {
        const res = await http.post("/auth/refresh");
        const value = res.data?.value ?? res.data;
        const access = value?.accessToken as string | undefined;
        if (access) setAccessToken(access);
        const me = await http.get("/auth/me");
        setUser((me.data?.value ?? me.data) as User);
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const actions = useMemo(
    () => ({
      async signIn(username: string, password: string) {
        const res = await http.post("/auth/sign-in", { username, password });
        const value = res.data?.value ?? res.data;
        const access = value?.accessToken as string | undefined;
        if (access) setAccessToken(access);
        const me = await http.get("/auth/me");
        setUser((me.data?.value ?? me.data) as User);
      },
      async signOut() {
        try {
          await http.post("/auth/logout");
        } catch {}
        setAccessToken(null);
        setUser(null);
      },
    }),
    []
  );

  return (
    <AuthContext.Provider value={{ user, loading, ...actions }}>
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
