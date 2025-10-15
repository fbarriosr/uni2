
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Loader2, Menu, MapPin, Sparkles } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User, Address } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter, usePathname } from 'next/navigation';
import { AppRoutes } from '@/lib/urls';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import Image from 'next/image';


interface NavbarProps {
  user: User | null;
  activeAddress: Address | null;
  isAuthLoading: boolean;
  onToggleSidebar: () => void;
  isSidebarVisible: boolean;
  onToggleChatbar: () => void;
}

export default function Navbar({ 
  user,
  activeAddress,
  isAuthLoading,
  onToggleSidebar,
  isSidebarVisible,
  onToggleChatbar,
}: NavbarProps) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Sesión Cerrada',
        description: 'Has cerrado sesión exitosamente.',
      });
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cerrar la sesión. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const showUserControls = !isAuthLoading && user && !isAuthPage;

  return (
    <header className="fixed top-0 left-0 right-0 h-[var(--header-height)] bg-card/95 backdrop-blur-sm shadow-md z-40 border-b">
      <div className="container mx-auto px-4 h-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          {showUserControls && isSidebarVisible && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              aria-label="Toggle Sidebar"
            >
              <Menu />
            </Button>
          )}
          <Link href={user ? "/inicio" : "/"} className="flex items-center gap-2 text-xl font-headline text-primary hover:opacity-80 transition-opacity">
            <Image src="https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/home%2Ficono.png?alt=media&token=01da1e37-9b0d-4da7-b6c2-ae3803cdcbcc" alt="UNI2 Logo" width={32} height={32} />
          </Link>
        </div>
        
        <nav className="flex items-center space-x-2">
          {isAuthLoading ? (
             <div className="flex items-center justify-center h-9 w-20">
               <Loader2 size={20} className="animate-spin text-primary" />
             </div>
           ) : showUserControls ? (
              <>
                {/* --- CONTEXT GROUP --- */}
                {activeAddress && (
                   <Button variant="outline" className="hidden sm:flex h-9 text-muted-foreground font-normal">
                    <MapPin size={16} className="mr-2 text-primary" />
                    <span className="truncate">{activeAddress.name}</span>
                   </Button>
                )}

                {/* --- ACTIONS GROUP --- */}
                <Separator orientation="vertical" className="h-6 mx-2" />

                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onToggleChatbar} 
                    title="Asistente IA" 
                    className="relative text-primary hover:text-primary hover:bg-primary/10 rounded-full"
                  >
                    <Sparkles size={22} className="transition-transform group-hover:scale-110" />
                    <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/80 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                    <span className="sr-only">Abrir Chat de Asistente IA</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar Sesión">
                  <LogOut size={20} />
                   <span className="sr-only">Salir</span>
                </Button>
              </>
          ) : (
            !isAuthPage && (
              <Button asChild>
                <Link href="/login">
                  <LogIn size={18} />
                  <span>Login</span>
                </Link>
              </Button>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
