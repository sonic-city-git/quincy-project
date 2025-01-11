import { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ session: null, loading: false });

export const useAuth = () => {
  return useContext(AuthContext);
};

// Generate a unique session ID for development bypass
const generateDevSessionId = () => {
  return Math.random().toString(36).substring(2, 15);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [devSessionId] = useState(() => {
    const stored = localStorage.getItem('dev-session-id');
    if (!stored) {
      const newId = generateDevSessionId();
      localStorage.setItem('dev-session-id', newId);
      return newId;
    }
    return stored;
  });

  // Create a mock session only for the browser with the matching dev session ID
  const mockSession = devSessionId === localStorage.getItem('dev-session-id') ? {
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