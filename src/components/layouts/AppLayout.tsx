import { ReactNode } from 'react';
import { TopNavigation } from "@/components/Navigation";
import { Toaster } from "@/components/ui/sonner";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <TopNavigation />
      <main>
        {children}
      </main>
      <Toaster />
    </div>
  );
}