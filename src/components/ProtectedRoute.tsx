import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();

  // Always render children since we have a mock session
  return <>{children}</>;
}