
'use client';

import { useState, ReactNode, useEffect, useRef } from 'react';
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
import { useIsMobile } from '@/hooks/use-mobile';


export default function AppLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeAddress, setActiveAddress] = useState<Address | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // State for AI Agents
  const { toast } = useToast();
  const pathname = usePathname();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [loadingAgents, setLoadingAgents] = useState(true);
  
  const mainScrollRef = useRef<HTMLElement>(null);

  // --- START: Scroll to top on route change ---
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [pathname]);
  // --- END: Scroll to top on route change ---

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

  // Fetch agents and set active agent
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
        
        let agentToSetActive = activeAgent;
        if (!agentToSetActive) {
            const uni2Agent = sortedAgents.find(a => a.nombre === 'Asistente UNI2');
            agentToSetActive = uni2Agent || sortedAgents[0] || null;
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
  }, [toast, currentUser]);


  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handleToggleChatbar = () => {
    setIsChatOpen(!isChatOpen);
  };

  const showSidebar = !!currentUser;
  const showChatbar = !!currentUser;
  const showFooter = !['/login', '/register'].includes(pathname);

  return (
    <ThemeProvider>
      <FilterProvider>
        <div className="flex h-screen bg-background">
           {showSidebar && (
            <>
              {/* Overlay for all screens when sidebar is open */}
              {isSidebarOpen && (
                 <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    onClick={handleToggleSidebar}
                    aria-hidden="true"
                />
              )}
              {/* Sidebar panel */}
              <Sidebar 
                isOpen={isSidebarOpen} 
                user={currentUser} 
                onClose={handleToggleSidebar}
              />
            </>
          )}
          
          <div className={cn(
            "flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out"
          )}>
            <Navbar 
              user={currentUser}
              activeAddress={activeAddress}
              isAuthLoading={authLoading}
              onToggleSidebar={handleToggleSidebar}
              isSidebarVisible={showSidebar}
              onToggleChatbar={handleToggleChatbar}
            />
            <main 
                ref={mainScrollRef}
                className={cn(
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
                  {showFooter && <Footer />}
                </>
               )}
            </main>
          </div>
          
           {/* Chatbar */}
           {showChatbar && (
            <>
              {/* Overlay for all screens when chat is open */}
              {isChatOpen && (
                <div
                  className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                  onClick={handleToggleChatbar}
                  aria-hidden="true"
                />
              )}
              {/* Chat panel */}
              <aside
                className={cn(
                  'fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col bg-card transition-transform duration-300 ease-in-out',
                  isChatOpen ? 'translate-x-0' : 'translate-x-full'
                )}
              >
                <LemonDropChat 
                    activeAgent={activeAgent} 
                    agents={agents}
                    setActiveAgent={setActiveAgent}
                    isLoading={loadingAgents}
                    onClose={handleToggleChatbar}
                />
              </aside>
            </>
          )}

        </div>
        <Toaster />
      </FilterProvider>
    </ThemeProvider>
  );
}
