
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, storage } from '../firebase';
import { collection, doc, setDoc, updateDoc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getActivityById, deleteActivity as dbDeleteActivity } from '../data';
import type { Activity, ActivityCategory, ActivityStatus } from '../types';
import { activityCategories, activityStatuses } from '../data';
import { AppRoutes } from '../urls';

// Helper to safely delete a file from Firebase Storage by its URL
async function deleteFileByUrl(url: string): Promise<void> {
    // Prevent trying to delete placeholder images or non-firebase URLs
    if (!url || !url.includes('firebasestorage.googleapis.com') || url.includes('placehold.co')) {
        // console.warn(`Skipping deletion of non-firebase storage or placeholder URL: ${url}`);
        return;
    }
    try {
        const fileRef = ref(storage, url);
        await deleteObject(fileRef);
    } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
            console.warn(`File to delete not found in storage: ${url}`);
        } else {
            console.error(`Failed to delete file from storage: ${url}`, error);
            // Do not re-throw, so the overall action can still succeed.
        }
    }
}


// Custom Zod preprocessor to handle empty strings for optional numbers,
// ensuring they become `undefined` instead of `0`.
const emptyStringToUndefined = z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.coerce.number().optional()
);

// Schema is mostly the same as the one in lib/actions.ts
const ActivitySchemaBase = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
  location: z.string().min(3, { message: "La ubicación es requerida." }),
  price: z.coerce.number().min(0, { message: "El precio no puede ser negativo." }).default(0),
  averageRating: emptyStringToUndefined.refine(val => val === undefined || (val >= 0 && val <= 5), {
    message: "La valoración debe estar entre 0 y 5."
  }),
  category: z.enum(activityCategories, { errorMap: () => ({ message: "Categoría inválida." }) }),
  status: z.enum(activityStatuses, { errorMap: () => ({ message: "Estado inválido." }) }),
  facilities: z.string().transform((val) => val.split(',').map(s => s.trim()).filter(s => s.length > 0)),
  duration: z.string().optional(),
  schedule: z.string().optional(),
  latitude: emptyStringToUndefined,
  longitude: emptyStringToUndefined,
});

export type ActivityFormState = {
  message: string;
  errors?: {
    name?: string[];
    description?: string[];
    location?: string[];
    price?: string[];
    averageRating?: string[];
    category?: string[];
    status?: string[];
    facilities?: string[];
    mainImage?: string[];
    galleries?: string[];
    duration?: string[];
    schedule?: string[];
    latitude?: string[];
    longitude?: string[];
    general?: string[];
  };
  success: boolean;
};


export async function createActivityAction(
  prevState: ActivityFormState,
  formData: FormData
): Promise<ActivityFormState> {
  try {
    const parsedBase = ActivitySchemaBase.safeParse({
      name: formData.get('name'),
      description: formData.get('description'),
      location: formData.get('location'),
      // price is not submitted on creation form
      category: formData.get('category'),
      status: formData.get('status'),
      facilities: formData.get('facilities') || '',
      duration: formData.get('duration'),
      schedule: formData.get('schedule'),
      latitude: formData.get('latitude'),
      longitude: formData.get('longitude'),
      averageRating: formData.get('averageRating'),
    });

    if (!parsedBase.success) {
      return {
        message: "Error de validación. Por favor, corrige los campos.",
        errors: parsedBase.error.flatten().fieldErrors,
        success: false,
      };
    }
    
    const newActivityRef = doc(collection(db, 'activities'));

    const activityDataForDb = {
        ...parsedBase.data,
        mainImage: 'https://placehold.co/600x400.png?text=IMAGEN+PENDIENTE',
        galleries: [],
        createdAt: serverTimestamp()
    };
  
    await setDoc(newActivityRef, activityDataForDb);
    
    revalidatePath(AppRoutes.admin.activities);
    return { message: `Actividad '${parsedBase.data.name}' creada exitosamente. Ahora puedes editarla para agregar imágenes y precios.`, success: true };
  } catch (error: any) {
    console.error("Error creating activity:", error);
    return {
      message: `Error en el servidor al crear la actividad. Por favor, inténtalo de nuevo. (${error.message || 'Error desconocido'})`,
      success: false
    };
  }
}

export async function updateActivityAction(
  id: string,
  prevState: ActivityFormState,
  formData: FormData
): Promise<ActivityFormState> {
  try {
    const parsedBase = ActivitySchemaBase.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
        location: formData.get('location'),
        price: formData.get('price'),
        averageRating: formData.get('averageRating'),
        category: formData.get('category'),
        status: formData.get('status'),
        facilities: formData.get('facilities') || '',
        duration: formData.get('duration'),
        schedule: formData.get('schedule'),
        latitude: formData.get('latitude'),
        longitude: formData.get('longitude'),
    });

    if (!parsedBase.success) {
      return {
        message: "Error de validación. Por favor, corrige los campos.",
        errors: parsedBase.error.flatten().fieldErrors,
        success: false,
      };
    }

    const activityDataForDb: { [key: string]: any } = { ...parsedBase.data };
    const docRef = doc(db, 'activities', id);
    const existingActivityDoc = await getDoc(docRef);
    const existingActivityData = existingActivityDoc.data() as Activity | undefined;

    // Handle Main Image
    const mainImageFile = formData.get('mainImage') as File | null;
    let oldMainImageUrl: string | undefined;

    if (mainImageFile && mainImageFile.size > 0) {
      oldMainImageUrl = existingActivityData?.mainImage;
      const uniqueFileName = `main-${Date.now()}-${mainImageFile.name}`;
      const storageRef = ref(storage, `actividades/${id}/${uniqueFileName}`);
      const fileBuffer = await mainImageFile.arrayBuffer();
      await uploadBytes(storageRef, fileBuffer, { contentType: mainImageFile.type });
      activityDataForDb.mainImage = await getDownloadURL(storageRef);
    }
    
    // Handle Gallery Images
    const galleryFiles = formData.getAll('galleryFiles') as File[];
    const existingGalleryUrlsToKeep = JSON.parse(formData.get('existingGalleryUrls') as string || '[]') as string[];
    const oldGalleryUrls = existingActivityData?.galleries || [];

    const newGalleryUrls: string[] = [];
    if (galleryFiles.length > 0) {
        for (const file of galleryFiles) {
            if (file.size > 0) {
                const uniqueFileName = `gallery-${Date.now()}-${file.name}`;
                const storageRef = ref(storage, `actividades/${id}/gallery/${uniqueFileName}`);
                const fileBuffer = await file.arrayBuffer();
                await uploadBytes(storageRef, fileBuffer, { contentType: file.type });
                newGalleryUrls.push(await getDownloadURL(storageRef));
            }
        }
    }
    
    activityDataForDb.galleries = [...existingGalleryUrlsToKeep, ...newGalleryUrls];

    // Update Firestore document with all data
    await updateDoc(docRef, activityDataForDb);
    
    // Cleanup: Delete old images after successful DB update
    if (oldMainImageUrl) {
      await deleteFileByUrl(oldMainImageUrl);
    }
    
    const urlsToDelete = oldGalleryUrls.filter(url => !existingGalleryUrlsToKeep.includes(url));
    if (urlsToDelete.length > 0) {
        for (const url of urlsToDelete) {
            await deleteFileByUrl(url);
        }
    }
    
    revalidatePath(AppRoutes.admin.activities);
    revalidatePath(AppRoutes.actividadesDetalle(id));
    revalidatePath(AppRoutes.admin.editActivity(id));
    return { message: 'Actividad actualizada exitosamente.', success: true };

  } catch (error: any) {
    console.error("Error updating activity:", error);
    let errorMessage = `Error en el servidor al actualizar la actividad. Por favor, inténtalo de nuevo.`;
    if (error.code === 'storage/unauthorized') {
        errorMessage = "Error de permisos al acceder a Firebase Storage. Revisa tus reglas de seguridad."
    } else if (error.message) {
        errorMessage += ` (${error.message})`
    }
    
    return { 
      message: errorMessage,
      success: false
    };
  }
}


export async function deleteActivityAction(id: string): Promise<{ success: boolean; message: string; }> {
    try {
        await dbDeleteActivity(id);
        revalidatePath(AppRoutes.admin.activities);
        return { success: true, message: "Actividad eliminada exitosamente."};
    } catch (error) {
        console.error("Error deleting activity:", error);
        return { success: false, message: "Error al eliminar la actividad."};
    }
}
