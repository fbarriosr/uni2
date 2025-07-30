
'use client';

import { useActionState, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { manageShareLinkAction } from '@/lib/actions/salidaActions';
import { Loader2, Share2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ShareButtonProps {
    salidaId: string;
    userId: string;
}

export default function ShareButton({ salidaId, userId }: ShareButtonProps) {
    const { toast } = useToast();
    const initialState = { success: false, message: '' };
    const [state, formAction, isPending] = useActionState(manageShareLinkAction, initialState);

    useEffect(() => {
        if (state.success && state.url) {
            navigator.clipboard.writeText(state.url);
            toast({
                title: "Enlace Copiado",
                description: "El enlace para compartir se ha copiado a tu portapapeles.",
            });
        } else if (!state.success && state.message) {
             toast({
                title: "Error al compartir",
                description: state.message,
                variant: "destructive",
            });
        }
    }, [state, toast]);

    return (
        <form action={formAction}>
            <input type="hidden" name="salidaId" value={salidaId} />
            <input type="hidden" name="userId" value={userId} />
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button type="submit" variant="outline" size="icon" disabled={isPending}>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Compartir Plan (vista pública)</p>
                    </TooltipContent>
                </Tooltip>
             </TooltipProvider>
        </form>
    );
}
