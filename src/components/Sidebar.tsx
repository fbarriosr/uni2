
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Settings, Users, Shield, Home } from 'lucide-react';
import type { User as AppUser } from '@/lib/types';
import { AppRoutes } from '@/lib/urls';


interface SidebarProps {
  isCollapsed: boolean;
  user: AppUser | null;
  onToggleSidebar: () => void;
}

const NavLink = ({ href, icon: Icon, label, isCollapsed, onClick }: { href: string; icon: React.ElementType; label: string; isCollapsed: boolean; onClick: () => void; }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link href={href} onClick={onClick}>
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

  const navItems = [
    { href: AppRoutes.inicio, icon: Home, label: 'Inicio' },
    { href: AppRoutes.configuraciones, icon: Settings, label: 'Configuraciones' },
    { href: AppRoutes.familia, icon: Users, label: 'Familia' },
    ...(isAdmin ? [{ href: '/admin', icon: Shield, label: 'Admin' }] : []),
  ];

  const handleLinkClick = () => {
    if (!isCollapsed) {
      onToggleSidebar();
    }
  };

  return (
     <aside className={cn(
        "fixed top-0 left-0 h-full z-50 flex flex-col flex-shrink-0 bg-card text-card-foreground border-r border-border transition-transform duration-300 ease-in-out",
        isCollapsed ? "w-16 -translate-x-full md:translate-x-0" : "w-64 translate-x-0"
    )}>
       <div className={cn("flex items-center h-[var(--header-height)] px-4 w-full", isCollapsed ? 'justify-center' : 'justify-start')}>
          <Link href={user ? "/inicio" : "/"} className="text-xl font-headline text-primary hover:opacity-80 transition-opacity whitespace-nowrap overflow-hidden">
            {isCollapsed ? 'U2' : 'UNI2'}
          </Link>
        </div>
      
        <div className="flex flex-col h-full">
            <Separator className="bg-border/50" />

            <nav className={cn("flex flex-col gap-2 flex-grow mt-4", isCollapsed ? 'px-3' : 'px-4')}>
                {navItems.map((item) => (
                    <NavLink key={item.href} {...item} isCollapsed={isCollapsed} onClick={handleLinkClick} />
                ))}
            </nav>

            <Separator className="bg-border/50" />

            <div className={cn("p-4 w-full", isCollapsed && "p-2")}>
                <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
                <Avatar className={cn("h-10 w-10", isCollapsed && "h-9 w-9")}>
                    <AvatarImage src={user?.avatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-muted text-muted-foreground">{fallbackLetter}</AvatarFallback>
                </Avatar>
                {!isCollapsed && (
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
