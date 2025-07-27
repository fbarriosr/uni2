
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { AppRoutes } from '../urls';
import { CLAIM_TYPES, type ClaimStatus } from '../types';

export type ClaimFormState = {
  message: string;
  errors?: {
    type?: string[];
    title?: string[];
    description?: string[];
    general?: string[];
  };
  success: boolean;
};

const ClaimSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string().email(),
  type: z.enum(CLAIM_TYPES, { required_error: 'Debes seleccionar un tipo.' }),
  title: z.string().min(5, { message: 'El título debe tener al menos 5 caracteres.' }),
  description: z.string().min(20, { message: 'La descripción debe tener al menos 20 caracteres.' }),
});

export async function createClaimAction(
  prevState: ClaimFormState,
  formData: FormData
): Promise<ClaimFormState> {
  const validatedFields = ClaimSchema.safeParse({
    userId: formData.get('userId'),
    userName: formData.get('userName'),
    userEmail: formData.get('userEmail'),
    type: formData.get('type'),
    title: formData.get('title'),
    description: formData.get('description'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Por favor, corrige los errores en el formulario.',
    };
  }

  try {
    const claimsCollectionRef = collection(db, 'claims');
    await addDoc(claimsCollectionRef, {
      ...validatedFields.data,
      status: 'pendiente',
      createdAt: serverTimestamp(),
    });
    
    // No need to revalidate any path as this is a "fire and forget" action from the user's perspective.
    
    return {
      success: true,
      message: '¡Gracias! Tu mensaje ha sido enviado. Nos pondremos en contacto contigo si es necesario.',
    };

  } catch (error) {
    console.error("Error creating claim:", error);
    return {
      success: false,
      message: 'Ocurrió un error en el servidor. Por favor, inténtalo de nuevo.',
    };
  }
}

export async function updateClaimStatusAction(claimId: string, status: ClaimStatus): Promise<{ success: boolean, message: string }> {
  try {
    const claimRef = doc(db, 'claims', claimId);
    await updateDoc(claimRef, { status });
    revalidatePath(AppRoutes.admin.claims);
    return { success: true, message: `El estado del reclamo ha sido actualizado a "${status}".` };
  } catch (error) {
    console.error("Error updating claim status:", error);
    return { success: false, message: "Error del servidor al actualizar el estado." };
  }
}
