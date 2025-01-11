import { createContext, useContext } from "react";
import { Session } from "@supabase/supabase-js";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ session: null, loading: false });

export const useAuth = () => {
  return useContext(AuthContext);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Create a mock session for development mode
  const isDevelopment = import.meta.env.DEV;
  const mockSession = isDevelopment ? {
    user: {
      id: 'dev-user',
      email: 'dev@example.com',
    },
    // Add other required Session properties
  } as Session : null;

  return (
    <AuthContext.Provider value={{ session: mockSession, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}