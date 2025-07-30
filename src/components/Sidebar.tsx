
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
import { useIsMobile } from '@/hooks/use-mobile';


interface SidebarProps {
  isCollapsed: boolean;
  user: AppUser | null;
  onToggleSidebar: () => void;
}

const NavLink = ({ href, icon: Icon, label, isCollapsed, onClick }: { href: string; icon: React.ElementType; label: string; isCollapsed: boolean; onClick: () => void; }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  const isMobile = useIsMobile();

  if (isCollapsed && !isMobile) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link href={href}>
              <Button variant={isActive ? "secondary" : "ghost"} size="icon" className="w-10 h-10">
                <Icon className="h-5 w-5" />
                <span className="sr-only">{label}</span>
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link href={href} onClick={onClick}>
      <Button variant={isActive ? "secondary" : "ghost"} className="w-full justify-start gap-3 px-4">
        <Icon className="h-5 w-5" />
        {label}
      </Button>
    </Link>
  );
};


export default function Sidebar({ isCollapsed, user, onToggleSidebar }: SidebarProps) {
  const isAdmin = user?.role === 'admin';
  const displayName = user?.nickname || user?.name || 'Usuario';
  const fallbackLetter = displayName.charAt(0).toUpperCase();
  const isMobile = useIsMobile();

  const navItems = [
    { href: AppRoutes.inicio, icon: Home, label: 'Inicio' },
    { href: AppRoutes.configuraciones, icon: Settings, label: 'Configuraciones' },
    { href: AppRoutes.familia, icon: Users, label: 'Familia' },
    ...(isAdmin ? [{ href: '/admin', icon: Shield, label: 'Admin' }] : []),
  ];

  const handleLinkClick = () => {
    // Only close sidebar on mobile
    if (window.innerWidth < 768) {
      onToggleSidebar();
    }
  };
  

  return (
     <aside className={cn(
        "fixed top-0 left-0 h-full z-50 flex flex-col flex-shrink-0 bg-card text-card-foreground border-r border-border transition-transform duration-300 ease-in-out",
        isCollapsed ? "w-64 md:w-16 -translate-x-full md:translate-x-0" : "w-64 translate-x-0"
    )}>
       <div className={cn("flex items-center justify-between h-[var(--header-height)] px-4 w-full")}>
          <Link href={user ? "/inicio" : "/"} className="text-xl font-headline text-primary hover:opacity-80 transition-opacity whitespace-nowrap overflow-hidden">
            {(isCollapsed && !isMobile) ? 'U2' : 'UNI2'}
          </Link>
          {(!isCollapsed || isMobile) && (
            <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="md:hidden">
              <X className="h-5 w-5" />
              <span className="sr-only">Cerrar menú</span>
            </Button>
          )}
        </div>
      
        <div className="flex flex-col h-full">
            <Separator className="bg-border/50" />

            <nav className={cn("flex flex-col gap-2 flex-grow mt-4 px-3")}>
                {navItems.map((item) => (
                    <NavLink key={item.href} {...item} isCollapsed={isCollapsed} onClick={handleLinkClick} />
                ))}
            </nav>

            <Separator className="bg-border/50" />

            <div className={cn("p-4 w-full", isCollapsed && 'md:p-2')}>
                <div className={cn("flex items-center gap-3", isCollapsed && "md:justify-center")}>
                <Avatar className={cn("h-10 w-10", isCollapsed && "md:h-9 md:w-9")}>
                    <AvatarImage src={user?.avatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-muted text-muted-foreground">{fallbackLetter}</AvatarFallback>
                </Avatar>
                {(!isCollapsed || isMobile) && (
                  <div className="flex-grow overflow-hidden">
                      <p className="font-semibold truncate text-sm">{displayName}</p>
                  </div>
                )}
                </div>
            </div>
        </div>
    </aside>
  );
}
