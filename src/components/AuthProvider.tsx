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

// Development email for bypassing authentication
const DEV_EMAIL = 'dev@sonicbooking.no';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Create a mock session only for the development email
  const mockSession = window.location.hostname === 'localhost' ? {
    user: {
      id: 'dev-user',
      email: DEV_EMAIL,
    },
    // Add other required Session properties
  } as Session : null;

  return (
    <AuthContext.Provider value={{ session: mockSession, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}