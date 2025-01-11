import { createContext, useContext } from "react";
import { Session } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Create a mock session that's always valid
  const mockSession = {
    access_token: 'dev_token',
    refresh_token: 'dev_refresh_token',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    user: {
      id: 'dev_user',
      email: 'dev@example.com',
      role: 'authenticated',
    },
  } as unknown as Session;

  return (
    <AuthContext.Provider value={{ session: mockSession, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}