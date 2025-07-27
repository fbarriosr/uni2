
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { addAgent, updateAgent, deleteAgent } from '@/lib/data';
import { AppRoutes } from '@/lib/urls';

// Zod Schema for agent validation
const AgentSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(2, "El nombre es requerido."),
  rol: z.string().min(5, "El rol es requerido."),
  prompt: z.string().min(20, "El prompt debe tener al menos 20 caracteres."),
  icono_principal: z.string().url("Debe ser una URL válida."),
  icono_secundario: z.string().url("Debe ser una URL válida."),
});

export type AgentFormState = {
  message: string;
  errors?: {
    nombre?: string[];
    rol?: string[];
    prompt?: string[];
    icono_principal?: string[];
    icono_secundario?: string[];
  };
  success: boolean;
};

export async function addOrUpdateAgentAction(prevState: AgentFormState, formData: FormData): Promise<AgentFormState> {
  const validatedFields = AgentSchema.safeParse({
    id: formData.get('id') || undefined,
    nombre: formData.get('nombre'),
    rol: formData.get('rol'),
    prompt: formData.get('prompt'),
    icono_principal: formData.get('icono_principal'),
    icono_secundario: formData.get('icono_secundario'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Error de validación.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }
  
  const { id, ...agentData } = validatedFields.data;

  try {
    if (id) {
      await updateAgent(id, agentData);
    } else {
      await addAgent(agentData);
    }
    
    revalidatePath(AppRoutes.configuracionesAgentes);
    revalidatePath(AppRoutes.inicio); // To reload chat agents
    return { message: `Agente ${id ? 'actualizado' : 'creado'} exitosamente.`, success: true };
  } catch (error) {
    console.error('Error processing agent:', error);
    return { message: 'Error del servidor al procesar el agente.', success: false };
  }
}

export async function deleteAgentAction(agentId: string): Promise<{ success: boolean; message: string; }> {
  try {
    await deleteAgent(agentId);
    revalidatePath(AppRoutes.configuracionesAgentes);
    revalidatePath(AppRoutes.inicio); // To reload chat agents
    return { success: true, message: 'Agente eliminado exitosamente.' };
  } catch (error) {
    console.error('Error deleting agent:', error);
    return { success: false, message: 'Error del servidor al eliminar el agente.' };
  }
}
