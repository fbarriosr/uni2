
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Settings, Users, Shield, Home, X } from 'lucide-react';
import type { User as AppUser } from '@/lib/types';
import { AppRoutes } from '@/lib/urls';
import Image from 'next/image';


interface SidebarProps {
  isOpen: boolean;
  user: AppUser | null;
  onClose: () => void;
}

const NavLink = ({ href, icon: Icon, label, onClick }: { href: string; icon: React.ElementType; label: string; onClick: () => void; }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} onClick={onClick}>
      <Button variant={isActive ? "secondary" : "ghost"} className="w-full justify-start gap-3 px-4 h-11 text-base">
        <Icon className="h-5 w-5" />
        {label}
      </Button>
    </Link>
  );
};


export default function Sidebar({ isOpen, user, onClose }: SidebarProps) {
  const isAdmin = user?.role === 'admin';
  const displayName = user?.nickname || user?.name || 'Usuario';
  const fallbackLetter = displayName.charAt(0).toUpperCase();

  const navItems = [
    { href: AppRoutes.inicio, icon: Home, label: 'Inicio' },
    { href: AppRoutes.configuraciones, icon: Settings, label: 'Configuraciones' },
    { href: AppRoutes.familia, icon: Users, label: 'Familia' },
    ...(isAdmin ? [{ href: '/admin', icon: Shield, label: 'Admin' }] : []),
  ];
  

  return (
     <aside className={cn(
        "fixed top-0 left-0 h-full z-50 flex flex-col w-64 flex-shrink-0 bg-card text-card-foreground border-r border-border transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
       <div className={cn("flex items-center justify-between h-[var(--header-height)] px-4 w-full")}>
          <Link href={user ? "/inicio" : "/"} className="flex items-center gap-2 text-xl font-headline text-primary hover:opacity-80 transition-opacity whitespace-nowrap overflow-hidden">
             <Image src="https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/home%2Ficono.png?alt=media&token=01da1e37-9b0d-4da7-b6c2-ae3803cdcbcc" alt="UNI2 Logo" width={40} height={40} />
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Cerrar menú</span>
          </Button>
        </div>
      
        <div className="flex flex-col h-full">
            <Separator className="bg-border/50" />

            <nav className={cn("flex flex-col gap-2 flex-grow mt-4 px-3")}>
                {navItems.map((item) => (
                    <NavLink key={item.href} {...item} onClick={onClose} />
                ))}
            </nav>

            <Separator className="bg-border/50" />

            <div className={cn("p-4 w-full")}>
                <div className={cn("flex items-center gap-3")}>
                <Avatar className={cn("h-10 w-10")}>
                    <AvatarImage src={user?.avatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-muted text-muted-foreground">{fallbackLetter}</AvatarFallback>
                </Avatar>
                  <div className="flex-grow overflow-hidden">
                      <p className="font-semibold truncate text-sm">{displayName}</p>
                  </div>
                </div>
            </div>
        </div>
    </aside>
  );
}
