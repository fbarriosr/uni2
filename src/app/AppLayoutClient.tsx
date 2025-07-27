'use client';

import { useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserById, getAgents } from '@/lib/data';
import type { User, Address, Agent } from '@/lib/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Sidebar from '@/components/Sidebar';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { FilterProvider } from '@/contexts/FilterContext';
import LemonDropChat from '@/components/LemonDropChat';
import { usePathname } from 'next/navigation';
import { AppRoutes } from '@/lib/urls';
import { useToast } from '@/hooks/use-toast';


export default function AppLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isChatbarCollapsed, setIsChatbarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeAddress, setActiveAddress] = useState<Address | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // State for AI Agents
  const { toast } = useToast();
  const pathname = usePathname();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [loadingAgents, setLoadingAgents] = useState(true);


  // Fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const appUser = await getUserById(user.uid);
        setCurrentUser(appUser || null);
        if (appUser?.addresses && appUser.activeAddressId) {
            setActiveAddress(appUser.addresses.find(a => a.id === appUser.activeAddressId) || null);
        } else {
            setActiveAddress(null);
        }
      } else {
        setCurrentUser(null);
        setActiveAddress(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch agents and set active agent based on route
  useEffect(() => {
    async function fetchAndSetAgents() {
      if (!currentUser) {
        setLoadingAgents(false);
        return;
      }; // Only fetch if user is logged in
      try {
        setLoadingAgents(true);
        const fetchedAgents = await getAgents();
        const sortedAgents = [...fetchedAgents].sort((a, b) => {
            if (a.nombre === 'Asistente UNI2') return -1;
            if (b.nombre === 'Asistente UNI2') return 1;
            return 0;
        });
        setAgents(sortedAgents);
        
        const uni2Agent = sortedAgents.find(a => a.nombre === 'Asistente UNI2');
        const legalAgent = sortedAgents.find(a => a.nombre === 'Asesor Legal');
        const vinculoAgent = sortedAgents.find(a => a.nombre === 'Vínculo Inteligente');

        let agentToSetActive = activeAgent; // Keep current if possible

        if (pathname.startsWith(AppRoutes.asesoriaLegal) && legalAgent) {
            agentToSetActive = legalAgent;
        } else if (pathname.startsWith(AppRoutes.vinculo) && vinculoAgent) {
            agentToSetActive = vinculoAgent;
        } else if (!activeAgent && uni2Agent) { // Only set default if no agent is active
            agentToSetActive = uni2Agent;
        } else if (!activeAgent && sortedAgents.length > 0) {
            agentToSetActive = sortedAgents[0];
        }

        setActiveAgent(agentToSetActive);

      } catch (error) {
        toast({
          title: "Error al cargar agentes",
          description: "No se pudieron cargar los asistentes de IA.",
          variant: "destructive"
        });
        console.error("Failed to fetch agents:", error);
      } finally {
        setLoadingAgents(false);
      }
    }
    fetchAndSetAgents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, pathname, currentUser]); // Rerun when user logs in/out

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  
  const handleToggleChatbar = () => {
    setIsChatbarCollapsed(!isChatbarCollapsed);
  };

  const showSidebar = !!currentUser;
  const showChatbar = !!currentUser;

  return (
    <ThemeProvider>
      <FilterProvider>
        <div className="flex h-screen bg-background">
          {showSidebar && <Sidebar isCollapsed={isSidebarCollapsed} user={currentUser} />}
          
          <div className="flex flex-col flex-1 overflow-hidden">
            <Navbar 
              user={currentUser}
              activeAddress={activeAddress}
              isAuthLoading={authLoading}
              onToggleSidebar={handleToggleSidebar}
              isSidebarVisible={showSidebar}
              onToggleChatbar={handleToggleChatbar}
              agents={agents}
              activeAgent={activeAgent}
              setActiveAgent={setActiveAgent}
              isLoadingAgents={loadingAgents}
            />
            <main className={cn(
                "flex-1 overflow-y-auto overflow-x-hidden",
                 "pt-[var(--header-height)]"
                 )}>
               {authLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
               ) : (
                <>
                  {children}
                  <Footer />
                </>
               )}
            </main>
          </div>
          
          {showChatbar && (
             <aside className={cn(
                  "hidden lg:flex flex-col flex-shrink-0 bg-card/50 transition-all duration-300 ease-in-out border-l",
                  isChatbarCollapsed ? "w-0 p-0 border-transparent" : "w-[380px]" 
              )}>
                <LemonDropChat agent={activeAgent} isLoading={loadingAgents} />
             </aside>
          )}

        </div>
        <Toaster />
      </FilterProvider>
    </ThemeProvider>
  );
}
