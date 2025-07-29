'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { User, Settings, Users, Shield, LogOut, ChevronLeft } from 'lucide-react';
import type { User as AppUser } from '@/lib/types';
import { AppRoutes } from '@/lib/urls';


interface SidebarProps {
  isCollapsed: boolean;
  user: AppUser | null;
}

const NavLink = ({ href, icon: Icon, label, isCollapsed }: { href: string; icon: React.ElementType; label: string; isCollapsed: boolean; }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  if (isCollapsed) {
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
    <Link href={href}>
      <Button variant={isActive ? "secondary" : "ghost"} className="w-full justify-start gap-3 px-4">
        <Icon className="h-5 w-5" />
        {label}
      </Button>
    </Link>
  );
};


export default function Sidebar({ isCollapsed, user }: SidebarProps) {
  const isAdmin = user?.role === 'admin';
  const displayName = user?.nickname || user?.name || 'Usuario';
  const fallbackLetter = displayName.charAt(0).toUpperCase();

  const navItems = [
    { href: AppRoutes.configuraciones, icon: Settings, label: 'Configuraciones' },
    { href: AppRoutes.familia, icon: Users, label: 'Familia' },
    ...(isAdmin ? [{ href: '/admin', icon: Shield, label: 'Admin' }] : []),
  ];

  return (
    <aside className={cn(
      "hidden md:flex flex-col flex-shrink-0 bg-card text-card-foreground border-r border-border transition-all duration-300 ease-in-out overflow-hidden",
      isCollapsed ? "w-0 p-0 border-r-0" : "w-60"
    )}>
       <div className={cn("flex items-center h-[var(--header-height)] px-4 w-full", isCollapsed ? 'justify-center' : 'justify-start')}>
          {!isCollapsed && <span className="text-xl font-headline text-primary">UNI2</span>}
        </div>
      
      {/* Sidebar Content: Conditionally rendered based on collapsed state */}
      {!isCollapsed && (
        <div className="flex flex-col h-full">
            <Separator className="bg-border/50" />

            <nav className="flex flex-col gap-2 flex-grow mt-4 px-4">
                {navItems.map((item) => (
                    <NavLink key={item.href} {...item} isCollapsed={isCollapsed} />
                ))}
            </nav>

            <Separator className="bg-border/50" />

            <div className="p-4 w-full">
                <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-muted text-muted-foreground">{fallbackLetter}</AvatarFallback>
                </Avatar>
                <div className="flex-grow overflow-hidden">
                    <p className="font-semibold truncate text-sm">{displayName}</p>
                </div>
                </div>
            </div>
        </div>
      )}
    </aside>
  );
}
