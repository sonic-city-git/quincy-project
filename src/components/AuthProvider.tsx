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
  // Provide a mock session context that always indicates authenticated
  return (
    <AuthContext.Provider value={{ session: {} as Session, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}