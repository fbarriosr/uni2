
'use client';

import { useActionState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addOrUpdateAgentAction, type AgentFormState } from '@/lib/actions/agentActions';
import type { Agent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

const AgentFormSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(2, "El nombre es requerido."),
  rol: z.string().min(5, "El rol es requerido."),
  prompt: z.string().min(20, "El prompt debe tener al menos 20 caracteres."),
  icono_principal: z.string().url("Debe ser una URL válida."),
  icono_secundario: z.string().url("Debe ser una URL válida."),
});

type AgentFormValues = z.infer<typeof AgentFormSchema>;

interface AgentFormProps {
  agent: Agent | null;
  onFinished: () => void;
}

export default function AgentForm({ agent, onFinished }: AgentFormProps) {
  const { toast } = useToast();
  const form = useForm<AgentFormValues>({
    resolver: zodResolver(AgentFormSchema),
    defaultValues: {
      id: agent?.id || undefined,
      nombre: agent?.nombre || '',
      rol: agent?.rol || '',
      prompt: agent?.prompt || '',
      icono_principal: agent?.icono_principal || '',
      icono_secundario: agent?.icono_secundario || '',
    },
  });

  const initialState: AgentFormState = { message: '', success: false };
  const [state, formAction, isPending] = useActionState(addOrUpdateAgentAction, initialState);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({ title: "Éxito", description: state.message });
        onFinished();
      } else {
        toast({ title: "Error", description: state.message || "Por favor, corrige los errores.", variant: "destructive"});
      }
    }
  }, [state, onFinished, toast]);

  return (
    <form action={formAction} className="space-y-4 py-4">
      <input type="hidden" {...form.register('id')} />

      <div>
        <Label htmlFor="nombre">Nombre del Agente</Label>
        <Input id="nombre" {...form.register('nombre')} />
        {form.formState.errors.nombre && <p className="text-sm text-destructive mt-1">{form.formState.errors.nombre.message}</p>}
        {state.errors?.nombre && <p className="text-sm text-destructive mt-1">{state.errors.nombre[0]}</p>}
      </div>

      <div>
        <Label htmlFor="rol">Rol del Agente</Label>
        <Input id="rol" {...form.register('rol')} />
        {form.formState.errors.rol && <p className="text-sm text-destructive mt-1">{form.formState.errors.rol.message}</p>}
        {state.errors?.rol && <p className="text-sm text-destructive mt-1">{state.errors.rol[0]}</p>}
      </div>
      
       <div>
        <Label htmlFor="prompt">Prompt del Sistema</Label>
        <Textarea id="prompt" {...form.register('prompt')} rows={8} />
        {form.formState.errors.prompt && <p className="text-sm text-destructive mt-1">{form.formState.errors.prompt.message}</p>}
        {state.errors?.prompt && <p className="text-sm text-destructive mt-1">{state.errors.prompt[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="icono_principal">URL Ícono Principal</Label>
            <Input id="icono_principal" {...form.register('icono_principal')} />
            {form.formState.errors.icono_principal && <p className="text-sm text-destructive mt-1">{form.formState.errors.icono_principal.message}</p>}
            {state.errors?.icono_principal && <p className="text-sm text-destructive mt-1">{state.errors.icono_principal[0]}</p>}
          </div>
          <div>
            <Label htmlFor="icono_secundario">URL Ícono Secundario</Label>
            <Input id="icono_secundario" {...form.register('icono_secundario')} />
            {form.formState.errors.icono_secundario && <p className="text-sm text-destructive mt-1">{form.formState.errors.icono_secundario.message}</p>}
            {state.errors?.icono_secundario && <p className="text-sm text-destructive mt-1">{state.errors.icono_secundario[0]}</p>}
          </div>
      </div>


      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onFinished}>Cancelar</Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Agente
        </Button>
      </div>
    </form>
  );
}
