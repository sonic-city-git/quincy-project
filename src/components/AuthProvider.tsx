import { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

const DEV_SESSION_KEY = 'dev_session_id';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function checkDevSession() {
      const storedSessionId = localStorage.getItem(DEV_SESSION_KEY);
      
      if (!storedSessionId) {
        // Create a new development session
        const { data: newSession, error } = await supabase
          .from('development_sessions')
          .insert({
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating development session:', error);
          return false;
        }

        localStorage.setItem(DEV_SESSION_KEY, newSession.id);
        return true;
      }

      // Check if the stored session is valid
      const { data: existingSession, error } = await supabase
        .from('development_sessions')
        .select()
        .eq('id', storedSessionId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) {
        console.error('Error checking development session:', error);
        return false;
      }

      return !!existingSession;
    }

    async function initializeAuth() {
      try {
        // Check for existing session
        const { data: { session: supabaseSession } } = await supabase.auth.getSession();
        
        if (supabaseSession) {
          setSession(supabaseSession);
          setLoading(false);
          return;
        }

        // If no session, check for development session
        const isValidDevSession = await checkDevSession();
        
        if (isValidDevSession) {
          // Create a mock session for development
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

          setSession(mockSession);
          toast({
            title: "Development Mode",
            description: "Using development session for authentication",
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    }

    // Initialize authentication
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}