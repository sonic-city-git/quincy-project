import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-zinc-900 border-zinc-800">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="text-5xl font-bold text-accent mb-2">QUINCY</h1>
          <p className="text-zinc-400">Sign in with Google to continue</p>
          <p className="text-sm text-zinc-500 mt-2">Rental management by Sonic City</p>
        </div>
        <SupabaseAuth 
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#9b87f5',
                  brandAccent: '#7E69AB',
                  inputBackground: 'rgb(39 39 42)',
                  inputText: 'white',
                  inputPlaceholder: 'rgb(161 161 170)',
                }
              }
            }
          }}
          providers={["google"]}
          redirectTo={window.location.origin}
          view="sign_in"
          showLinks={false}
          onlyThirdPartyProviders={true}
        />
      </Card>
    </div>
  );
};

export default Auth;