
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db, storage } from '../firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AppRoutes } from '../urls';
import { CONTENT_STATUSES } from '../types';

// --- Generic Action State ---
export type LearningContentFormState = {
  message: string;
  errors?: Record<string, string[] | undefined>;
  success: boolean;
};

// --- Helper for Image Upload ---
async function uploadImage(entity: string, id: string, file: File): Promise<string> {
    const storagePath = `public/academia/${entity}/${id}/${file.name}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
}

// --- Learning Path Actions ---
const LearningPathSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "El título es requerido."),
  status: z.enum(CONTENT_STATUSES),
});

export async function manageLearningPath(prevState: LearningContentFormState, formData: FormData): Promise<LearningContentFormState> {
  const validatedFields = LearningPathSchema.safeParse({
    id: formData.get('id') as string || undefined,
    title: formData.get('title'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) return { success: false, message: 'Error de validación', errors: validatedFields.error.flatten().fieldErrors };
  
  const { id, ...data } = validatedFields.data;
  const coverImageFile = formData.get('coverImage') as File;

  try {
    const docId = id || doc(collection(db, 'learningPaths')).id;
    const docRef = doc(db, 'learningPaths', docId);

    let coverImage = '';
    if (coverImageFile && coverImageFile.size > 0) {
      coverImage = await uploadImage('learningPaths', docId, coverImageFile);
    } else if (id) {
      // Keep existing image if not updating
      coverImage = formData.get('existingCoverImage') as string;
    }

    if (id) {
      await updateDoc(docRef, { ...data, ...(coverImage && { coverImage }) });
    } else {
      if (!coverImage) return { success: false, message: 'La imagen de portada es requerida para crear.' };
      await setDoc(docRef, { ...data, coverImage, createdAt: serverTimestamp() });
    }

    revalidatePath(AppRoutes.admin.learningPaths);
    revalidatePath(AppRoutes.vinculo);
    return { success: true, message: `Ruta de aprendizaje ${id ? 'actualizada' : 'creada'}.` };
  } catch (e) {
    return { success: false, message: 'Error del servidor.' };
  }
}

export async function deleteLearningPath(id: string): Promise<{ success: boolean }> {
  await deleteDoc(doc(db, 'learningPaths', id));
  revalidatePath(AppRoutes.admin.learningPaths);
  revalidatePath(AppRoutes.vinculo);
  return { success: true };
}


// --- Micro-Lesson Actions ---
const MicroLessonSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "El título es requerido."),
  description: z.string().min(10, "La descripción es requerida."),
  status: z.enum(CONTENT_STATUSES),
  image: z.any().optional(),
});

export async function manageMicroLesson(prevState: LearningContentFormState, formData: FormData): Promise<LearningContentFormState> {
  const validatedFields = MicroLessonSchema.safeParse({
    id: formData.get('id') as string || undefined,
    title: formData.get('title'),
    description: formData.get('description'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) return { success: false, message: 'Error de validación', errors: validatedFields.error.flatten().fieldErrors };
  
  const { id, ...data } = validatedFields.data;
  const imageFile = formData.get('image') as File;
  const collectionPath = 'vinculos/contenido/micro_lecciones';
  const storageCollectionPath = 'public/academia/micro_lecciones';

  try {
    // Ensure the parent document exists before trying to access its subcollection
    const parentDocRef = doc(db, 'vinculos', 'contenido');
    await setDoc(parentDocRef, { _placeholder: true }, { merge: true });

    const docId = id || doc(collection(db, collectionPath)).id;
    const docRef = doc(db, collectionPath, docId);

    let image = formData.get('existingImage') as string | undefined;
    if (imageFile && imageFile.size > 0) {
      const storageRef = ref(storage, `${storageCollectionPath}/${docId}/${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      image = await getDownloadURL(storageRef);
    }

    const dataToSave: { [key: string]: any } = { ...data };
    if (image) {
      dataToSave.image = image;
    }


    if (id) {
      await updateDoc(docRef, dataToSave);
    } else {
      dataToSave.createdAt = serverTimestamp();
      await setDoc(docRef, dataToSave);
    }

    revalidatePath(AppRoutes.admin.microLessons);
    revalidatePath(AppRoutes.vinculo);
    return { success: true, message: `Micro-lección ${id ? 'actualizada' : 'creada'}.` };
  } catch (e) {
    console.error("Error managing micro-lesson:", e);
    return { success: false, message: 'Error del servidor.' };
  }
}

export async function deleteMicroLesson(id: string): Promise<{ success: boolean }> {
  await deleteDoc(doc(db, 'vinculos/contenido/micro_lecciones', id));
  revalidatePath(AppRoutes.admin.microLessons);
  revalidatePath(AppRoutes.vinculo);
  return { success: true };
}

// --- Challenge Actions ---
const ChallengeSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "El título es requerido."),
  period: z.enum(['weekly', 'monthly']),
  status: z.enum(CONTENT_STATUSES),
});

export async function manageChallenge(prevState: LearningContentFormState, formData: FormData): Promise<LearningContentFormState> {
  const validatedFields = ChallengeSchema.safeParse({
    id: formData.get('id') as string || undefined,
    title: formData.get('title'),
    period: formData.get('period'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) return { success: false, message: 'Error de validación', errors: validatedFields.error.flatten().fieldErrors };
  
  const { id, ...data } = validatedFields.data;
  const imageFile = formData.get('image') as File;

  try {
    const docId = id || doc(collection(db, 'challenges')).id;
    const docRef = doc(db, 'challenges', docId);

    let image = '';
    if (imageFile && imageFile.size > 0) {
      image = await uploadImage('challenges', docId, imageFile);
    } else if (id) {
      image = formData.get('existingImage') as string;
    }

    if (id) {
      await updateDoc(docRef, { ...data, ...(image && { image }) });
    } else {
      if (!image) return { success: false, message: 'La imagen es requerida para crear.' };
      await setDoc(docRef, { ...data, image, createdAt: serverTimestamp() });
    }

    revalidatePath(AppRoutes.admin.challenges);
    revalidatePath(AppRoutes.vinculo);
    return { success: true, message: `Desafío ${id ? 'actualizado' : 'creado'}.` };
  } catch (e) {
    return { success: false, message: 'Error del servidor.' };
  }
}

export async function deleteChallenge(id: string): Promise<{ success: boolean }> {
  await deleteDoc(doc(db, 'challenges', id));
  revalidatePath(AppRoutes.admin.challenges);
  revalidatePath(AppRoutes.vinculo);
  return { success: true };
}

// --- Article Actions ---
const ArticleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "El título es requerido."),
  status: z.enum(CONTENT_STATUSES),
});

export async function manageArticle(prevState: LearningContentFormState, formData: FormData): Promise<LearningContentFormState> {
  const validatedFields = ArticleSchema.safeParse({
    id: formData.get('id') as string || undefined,
    title: formData.get('title'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) return { success: false, message: 'Error de validación', errors: validatedFields.error.flatten().fieldErrors };
  
  const { id, ...data } = validatedFields.data;
  const coverImageFile = formData.get('coverImage') as File;

  try {
    const docId = id || doc(collection(db, 'articles')).id;
    const docRef = doc(db, 'articles', docId);

    let coverImage = '';
    if (coverImageFile && coverImageFile.size > 0) {
      coverImage = await uploadImage('articles', docId, coverImageFile);
    } else if (id) {
      coverImage = formData.get('existingCoverImage') as string;
    }

    if (id) {
      await updateDoc(docRef, { ...data, ...(coverImage && { coverImage }) });
    } else {
      if (!coverImage) return { success: false, message: 'La imagen de portada es requerida.' };
      await setDoc(docRef, { ...data, coverImage, createdAt: serverTimestamp() });
    }

    revalidatePath(AppRoutes.admin.articles);
    revalidatePath(AppRoutes.vinculo);
    return { success: true, message: `Artículo ${id ? 'actualizado' : 'creado'}.` };
  } catch (e) {
    return { success: false, message: 'Error del servidor.' };
  }
}

export async function deleteArticle(id: string): Promise<{ success: boolean }> {
  await deleteDoc(doc(db, 'articles', id));
  revalidatePath(AppRoutes.admin.articles);
  revalidatePath(AppRoutes.vinculo);
  return { success: true };
}

// --- Expert Actions ---
const ExpertSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "El nombre es requerido."),
  specialty: z.string().min(3, "La especialidad es requerida."),
  lugar_de_trabajo: z.string().optional(),
  horario: z.string().optional(),
  descripcion: z.string().optional(),
  trayectoria: z.string().optional(),
  comentario_ia: z.string().optional(),
  sitio_web: z.string().optional(),
  comentarios_padres: z.string().transform((val) => val.split('\n').map(s => s.trim()).filter(Boolean)).optional(),
});

// --- Legal Expert Actions ---
const LegalExpertSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "El nombre es requerido."),
  specialty: z.string().min(3, "La especialidad es requerida."),
  lugar_de_trabajo: z.string().optional(),
  horario: z.string().optional(),
  descripcion: z.string().optional(),
  sitio_web: z.string().optional(),
  areas_de_practica: z.string().optional(),
  comentario_ia: z.string().optional(),
  comentarios_padres: z.string().transform((val) => val.split('\n').map(s => s.trim()).filter(Boolean)).optional(),
});

async function expertAction(
  collectionName: 'expertos_vinculos' | 'legal_expertos',
  storagePath: 'vinculos/expertos' | 'legal/expertos',
  formData: FormData,
  schema: z.Schema
): Promise<LearningContentFormState> {
  
  const formEntries = Object.fromEntries(formData.entries());
  const validatedFields = schema.safeParse(formEntries);

  if (!validatedFields.success) {
    console.log(validatedFields.error.flatten().fieldErrors);
    return { success: false, message: 'Error de validación', errors: validatedFields.error.flatten().fieldErrors };
  }
  
  const { id, ...data } = validatedFields.data;
  const photoFile = formData.get('photo') as File;
  const dataToSave: { [key: string]: any } = { ...data };

  try {
    const docId = id || doc(collection(db, collectionName)).id;
    const docRef = doc(db, collectionName, docId);

    let photoUrl = formData.get('existingPhoto') as string | undefined;

    if (photoFile && photoFile.size > 0) {
        const fileStoragePath = `${storagePath}/${docId}/${photoFile.name}`;
        const storageRef = ref(storage, fileStoragePath);
        await uploadBytes(storageRef, photoFile);
        photoUrl = await getDownloadURL(storageRef);
    }
    
    if (photoUrl) {
      dataToSave.photo = photoUrl;
    }

    if (id) {
      await updateDoc(docRef, dataToSave);
    } else {
      dataToSave.createdAt = serverTimestamp();
      await setDoc(docRef, dataToSave);
    }

    revalidatePath(AppRoutes.admin.experts);
    revalidatePath(AppRoutes.admin.legalExperts);
    revalidatePath(AppRoutes.vinculo);
    revalidatePath(AppRoutes.asesoriaLegal);
    return { success: true, message: `Experto ${id ? 'actualizado' : 'creado'}.` };
  } catch (e) {
    console.error(`Error managing expert in ${collectionName}:`, e);
    return { success: false, message: `Error del servidor al gestionar el experto.` };
  }
}

export async function manageExpert(prevState: LearningContentFormState, formData: FormData): Promise<LearningContentFormState> {
  return expertAction('expertos_vinculos', 'vinculos/expertos', formData, ExpertSchema);
}

export async function manageLegalExpert(prevState: LearningContentFormState, formData: FormData): Promise<LearningContentFormState> {
  return expertAction('legal_expertos', 'legal/expertos', formData, LegalExpertSchema);
}


export async function deleteExpert(id: string): Promise<{ success: boolean }> {
  await deleteDoc(doc(db, 'expertos_vinculos', id));
  revalidatePath(AppRoutes.admin.experts);
  revalidatePath(AppRoutes.vinculo);
  return { success: true };
}

export async function deleteLegalExpert(id: string): Promise<{ success: boolean }> {
    await deleteDoc(doc(db, 'legal_expertos', id));
    revalidatePath(AppRoutes.admin.legalExperts);
    revalidatePath(AppRoutes.asesoriaLegal);
    return { success: true };
}


// --- Suggested Reading Actions ---
const SuggestedReadingSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "El título es requerido."),
  subtitle: z.string().min(3, "El subtítulo es requerido."),
  status: z.enum(CONTENT_STATUSES),
});

export async function manageSuggestedReading(prevState: LearningContentFormState, formData: FormData): Promise<LearningContentFormState> {
  const validatedFields = SuggestedReadingSchema.safeParse({
    id: formData.get('id') as string || undefined,
    title: formData.get('title'),
    subtitle: formData.get('subtitle'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) return { success: false, message: 'Error de validación', errors: validatedFields.error.flatten().fieldErrors };
  
  const { id, ...data } = validatedFields.data;
  const coverImageFile = formData.get('coverImage') as File;

  try {
    const docId = id || doc(collection(db, 'suggestedReadings')).id;
    const docRef = doc(db, 'suggestedReadings', docId);

    let coverImage = '';
    if (coverImageFile && coverImageFile.size > 0) {
      coverImage = await uploadImage('suggestedReadings', docId, coverImageFile);
    } else if (id) {
      coverImage = formData.get('existingCoverImage') as string;
    }

    if (id) {
      await updateDoc(docRef, { ...data, ...(coverImage && { coverImage }) });
    } else {
      if (!coverImage) return { success: false, message: 'La imagen de portada es requerida.' };
      await setDoc(docRef, { ...data, coverImage });
    }

    revalidatePath(AppRoutes.admin.suggestedReadings);
    revalidatePath(AppRoutes.vinculo);
    return { success: true, message: `Lectura sugerida ${id ? 'actualizada' : 'creada'}.` };
  } catch (e) {
    return { success: false, message: 'Error del servidor.' };
  }
}

export async function deleteSuggestedReading(id: string): Promise<{ success: boolean }> {
  await deleteDoc(doc(db, 'suggestedReadings', id));
  revalidatePath(AppRoutes.admin.suggestedReadings);
  revalidatePath(AppRoutes.vinculo);
  return { success: true };
}
