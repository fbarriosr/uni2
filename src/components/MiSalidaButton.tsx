
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type React from 'react';

export interface MiSalidaButtonProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  href?: string;
}

const MiSalidaButton: React.FC<MiSalidaButtonProps> = ({ icon: Icon, label, isActive, href = "#" }) => (
  <Link href={href} passHref>
    <Button
      variant={isActive ? "default" : "outline"}
      className={cn(
        "flex flex-col items-center justify-center h-20 w-20 p-2 rounded-lg shadow-md",
        isActive ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground hover:bg-muted"
      )}
    >
      <Icon className={cn("w-10 h-10", isActive ? "text-primary-foreground" : "text-primary")} />
      <span className="mt-1.5 text-xs font-medium text-center leading-tight">{label}</span>
    </Button>
  </Link>
);

export default MiSalidaButton;
