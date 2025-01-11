import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const signInDev = async () => {
      if (import.meta.env.DEV && !session) {
        console.log('Attempting dev mode signin...');
        try {
          const { data, error } = await supabase.auth.signUp({
            email: 'dev@soniccity.no',
            password: 'devmode123',
          });
          
          if (error) {
            // If user already exists, try to sign in
            if (error.message.includes('User already registered')) {
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: 'dev@soniccity.no',
                password: 'devmode123',
              });
              
              if (signInError) {
                console.error('Dev mode signin failed:', signInError);
                toast.error('Development mode sign in failed');
              } else {
                console.log('Dev mode signin successful:', signInData);
              }
            } else {
              console.error('Dev mode signup failed:', error);
              toast.error('Development mode sign up failed');
            }
          } else {
            console.log('Dev mode signup successful:', data);
          }
        } catch (err) {
          console.error('Error in dev mode auth:', err);
          toast.error('Development mode authentication error');
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