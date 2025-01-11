import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const signInDev = async () => {
      if (import.meta.env.DEV && !session) {
        const { error } = await supabase.auth.signInWithPassword({
          email: 'dev@soniccity.no',
          password: 'devmode123',
        });
        if (error) {
          console.error('Dev mode signin failed:', error);
        }
      }
    };

    signInDev();
  }, [session]);

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
    </div>;
  }

  // In development, wait for dev signin
  if (import.meta.env.DEV && !session) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
    </div>;
  }

  // In production, redirect to auth if not authenticated
  if (!import.meta.env.DEV && !session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}