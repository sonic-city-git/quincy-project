import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isDevelopment = import.meta.env.DEV;
  const { session } = useAuth();
  const location = useLocation();

  // In development mode, always render children
  if (isDevelopment) {
    return <>{children}</>;
  }

  // In production, check for authentication
  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}