
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cancelSalidaAction } from '@/lib/actions/salidaActions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CancelOutingButtonProps {
  salidaId: string;
  userId: string;
}

const cancellationReasons = [
    { id: 'change-of-plans', label: 'Cambio de planes' },
    { id: 'weather', label: 'Mal tiempo' },
    { id: 'illness', label: 'Enfermedad' },
    { id: 'other', label: 'Otro motivo' },
];

export default function CancelOutingButton({ salidaId, userId }: CancelOutingButtonProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [reason, setReason] = useState(cancellationReasons[0].id);
  const [otherReason, setOtherReason] = useState('');

  const handleCancel = async () => {
    setIsPending(true);
    
    const finalReason = reason === 'other' ? otherReason : reason;
    if (!finalReason.trim()) {
        toast({
            title: "Motivo requerido",
            description: "Por favor, especifica un motivo para la cancelación.",
            variant: "destructive",
        });
        setIsPending(false);
        return;
    }

    try {
      // The action now handles the redirect, so we don't need to check the result here
      // unless we want to show a specific success/error toast before the redirect happens.
      await cancelSalidaAction(salidaId, userId, finalReason);
      toast({
        title: "Salida Cancelada",
        description: "El plan ha sido eliminado.",
      });
      setIsOpen(false);
    } catch (error: any) {
        // This catch block will now only catch non-redirect errors from the action
        if (!error.digest?.startsWith('NEXT_REDIRECT')) {
             toast({
                title: "Error",
                description: "No se pudo cancelar la salida. Inténtalo de nuevo.",
                variant: "destructive",
            });
        }
    } finally {
        // This might not be reached if redirect happens immediately.
        setIsPending(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Cancelar Salida
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro de que quieres cancelar este plan?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción es irreversible. Se eliminará el plan de salida y todas sus actividades asociadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4 space-y-4">
            <Label htmlFor="cancellation-reason">Por favor, indícanos el motivo de la cancelación:</Label>
            <RadioGroup id="cancellation-reason" value={reason} onValueChange={setReason}>
                {cancellationReasons.map((r) => (
                    <div key={r.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={r.id} id={r.id} />
                        <Label htmlFor={r.id}>{r.label}</Label>
                    </div>
                ))}
            </RadioGroup>
            {reason === 'other' && (
                <Textarea 
                    placeholder="Por favor, especifica el motivo..."
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    className="mt-2"
                />
            )}
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Volver</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleCancel} 
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Cancelación
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
