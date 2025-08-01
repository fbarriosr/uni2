
'use server';

import { z } from 'zod';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, updateDoc, getDoc, getDocs, writeBatch, query, orderBy, deleteDoc, where, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AppRoutes } from '@/lib/urls';
import type { ActivityRequestStatus, ItineraryEvent, Activity, FullEvaluation, User, BitacoraEvent, BitacoraEventType } from '@/lib/types';
import { getUserById, getUsersByIds } from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';


export type SaveSalidaState = {
  message: string;
  success: boolean;
  errors?: {
    general?: string[];
  };
};

export type RequestActivityState = {
  message: string;
  success: boolean;
};

const SalidaSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
  selectedParticipantIds: z.string().transform((val) => val.split(',').filter(Boolean)), // Changed from selectedGroupId
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  transportMode: z.string().optional(),
  filters: z.string().transform((val) => val.split(',').filter(Boolean)),
  otherPreference: z.string().optional(),
});

export async function saveSalidaPreferences(
  prevState: SaveSalidaState,
  formData: FormData
): Promise<SaveSalidaState> {
  const validatedFields = SalidaSchema.safeParse({
    userId: formData.get('userId'),
    selectedParticipantIds: formData.get('selectedParticipantIds'), // Changed
    dateFrom: formData.get('dateFrom'),
    dateTo: formData.get('dateTo'),
    transportMode: formData.get('transportMode'),
    filters: formData.get('filters'),
    otherPreference: formData.get('otherPreference'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Error de validación.',
      errors: { general: validatedFields.error.flatten().formErrors },
      success: false,
    };
  }

  const { userId, selectedParticipantIds, dateFrom, dateTo, transportMode, filters, otherPreference } = validatedFields.data; // Changed

  if (!dateFrom) {
     return {
      message: 'La fecha de inicio es requerida.',
      success: false,
    };
  }
  
  try {
    const salidasCollectionRef = collection(db, `users/${userId}/salidas`);
    
    const docRef = await addDoc(salidasCollectionRef, {
      participantIds: selectedParticipantIds || [], // Changed from groupId
      dateRange: {
        from: dateFrom,
        to: dateTo || null,
      },
      transportMode: transportMode || null,
      activityFilters: filters,
      otherPreference: otherPreference || null,
      createdAt: serverTimestamp(),
      isPublic: false, // Initialize sharing as false
      status: 'planificada', // New status field
      bitacora: [], // New logbook field
      ubicacionInicio: null, // New start location field
      ubicacionFin: null, // New end location field
    });

    revalidatePath('/nueva_salida');
    
    redirect(AppRoutes.salidas.detail(docRef.id));

  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Error guardando preferencias de salida:', error);
    return { message: 'Error del servidor. No se pudieron guardar las preferencias.', success: false };
  }
}


export async function requestActivityForSalida(
  salidaId: string,
  activityId: string,
  userId: string
): Promise<RequestActivityState> {
  if (!userId) return { message: 'Debes iniciar sesión para hacer una solicitud.', success: false };
  if (!salidaId || !activityId) return { message: 'Falta información de la salida o actividad para procesar la solicitud.', success: false };

  try {
    const requestingUser = await getUserById(userId);
    if (!requestingUser) return { message: 'Usuario no encontrado.', success: false };

    const familyHeadUid = requestingUser.role === 'hijo' && requestingUser.parentUid ? requestingUser.parentUid : userId;

    const activityRequestDocRef = doc(db, 'users', familyHeadUid, 'salidas', salidaId, 'actividades', activityId);

    await setDoc(activityRequestDocRef, {
      status: 'pending',
      requestedAt: serverTimestamp(),
      createdByUid: userId,
      createdByRole: requestingUser.role,
      votes: { [userId]: 'liked' },
    });

    revalidatePath(`/salidas/${salidaId}`);
    revalidatePath('/inicio');
    
    return { message: 'Actividad solicitada con éxito. Esperando aprobación.', success: true };
  } catch (error) {
    console.error('Error al solicitar actividad:', error);
    return { message: 'Error del servidor. No se pudo solicitar la actividad.', success: false };
  }
}


export async function recordVoteForActivity(salidaId: string, activityId: string, voterId: string, vote: 'liked' | 'disliked'): Promise<{ success: boolean, message: string }> {
    if (!voterId || !salidaId || !activityId || !vote) {
        return { success: false, message: 'Faltan datos para registrar el voto.' };
    }
    try {
        const voter = await getUserById(voterId);
        if (!voter) return { success: false, message: 'Usuario votante no encontrado.' };

        const familyHeadUid = voter.role === 'hijo' && voter.parentUid ? voter.parentUid : voterId;
        if (!familyHeadUid) return { success: false, message: 'No se pudo determinar el grupo familiar.' };

        const activityRequestRef = doc(db, 'users', familyHeadUid, 'salidas', salidaId, 'actividades', activityId);
        const activityRequestSnap = await getDoc(activityRequestRef);

        if (!activityRequestSnap.exists()) return { success: false, message: 'La actividad solicitada no existe.' };
        
        const activityData = activityRequestSnap.data();
        const updatedVotes = { ...activityData.votes, [voterId]: vote };

        let newStatus: ActivityRequestStatus = 'pending';

        const salidaRef = doc(db, 'users', familyHeadUid, 'salidas', salidaId);
        const salidaSnap = await getDoc(salidaRef);
        if (!salidaSnap.exists()) return { success: false, message: 'Salida no encontrada.' };

        const participantIds = [familyHeadUid, ...(salidaSnap.data().participantIds || [])];
        const uniqueParticipantIds = Array.from(new Set(participantIds));
        const participants = await getUsersByIds(uniqueParticipantIds);
        
        const parentUids = participants.filter(p => p.role !== 'hijo').map(p => p.id);
        const childUids = participants.filter(p => p.role === 'hijo').map(p => p.id);
        
        const parentVotes = parentUids.map(id => updatedVotes[id]);
        const childVotes = childUids.map(id => updatedVotes[id]);

        if (parentVotes.includes('disliked')) {
            newStatus = 'rejected';
        } else if (parentVotes.includes('liked') && childVotes.includes('liked')) {
            newStatus = 'matched';
        }

        await updateDoc(activityRequestRef, {
            votes: updatedVotes,
            status: newStatus
        });
        
        revalidatePath(AppRoutes.salidas.match(salidaId));
        return { success: true, message: 'Voto registrado.' };

    } catch (error) {
        console.error('Error registrando voto:', error);
        return { success: false, message: 'Error del servidor al registrar el voto.' };
    }
}

export async function confirmActivityByParentAction(salidaId: string, activityId: string, parentId: string): Promise<{ success: boolean, message: string }> {
     if (!parentId || !salidaId || !activityId) return { success: false, message: 'Faltan datos.' };
    
    try {
        const parent = await getUserById(parentId);
        if (!parent || parent.role === 'hijo') return { success: false, message: 'Acción no permitida.' };
        
        const activityRequestRef = doc(db, 'users', parentId, 'salidas', salidaId, 'actividades', activityId);
        await updateDoc(activityRequestRef, { status: 'selected_by_parent' });

        revalidatePath(AppRoutes.salidas.match(salidaId));
        return { success: true, message: 'Actividad confirmada por padre/madre.' };

    } catch (error) {
        console.error('Error confirmando actividad:', error);
        return { success: false, message: 'Error del servidor.' };
    }
}

export async function removeActivityFromSummary(salidaId: string, activityId: string, userId: string): Promise<{ success: boolean, message: string }> {
     if (!userId || !salidaId || !activityId) return { success: false, message: 'Faltan datos.' };
    
    try {
        const user = await getUserById(userId);
        if (!user || user.role === 'hijo') return { success: false, message: 'Acción no permitida.' };
        
        const familyHeadUid = user.role === 'hijo' && user.parentUid ? user.parentUid : userId;
        const activityRequestRef = doc(db, 'users', familyHeadUid, 'salidas', salidaId, 'actividades', activityId);
        await updateDoc(activityRequestRef, { status: 'pending' });

        revalidatePath(AppRoutes.salidas.match(salidaId));
        return { success: true, message: 'Actividad devuelta a votación.' };

    } catch (error) {
        console.error('Error devolviendo actividad:', error);
        return { success: false, message: 'Error del servidor.' };
    }
}


export async function cancelSalidaAction(salidaId: string, userId: string, reason: string): Promise<{ success: boolean, message: string }> {
  if (!userId || !salidaId) return { success: false, message: "Faltan datos para cancelar la salida." };
  
  try {
    const user = await getUserById(userId);
    if (!user) return { success: false, message: 'Usuario no encontrado.' };
    const familyHeadUid = user.role === 'hijo' && user.parentUid ? user.parentUid : userId;

    const batch = writeBatch(db);
    const outingRef = doc(db, 'users', familyHeadUid, 'salidas', salidaId);

    const subcollections = ['actividades', 'itinerary', 'evaluations', 'recuerdos'];
    for (const subcollectionName of subcollections) {
      const subcollectionRef = collection(db, outingRef.path, subcollectionName);
      const snapshot = await getDocs(subcollectionRef);
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
    }

    batch.delete(outingRef);

    await batch.commit();

    console.log(`Outing ${salidaId} for family of ${familyHeadUid} cancelled. Reason: ${reason}`);

  } catch (error) {
    console.error("Error cancelling outing:", error);
    return { success: false, message: "Error del servidor al cancelar la salida." };
  }

  revalidatePath('/inicio');
  revalidatePath('/salidas');
  redirect('/inicio');
}

export async function updateSalidaParticipants(salidaId: string, userId: string, participantIds: string[]): Promise<{success: boolean; message: string}> {
    if (!userId || !salidaId) return { success: false, message: "Faltan datos para actualizar." };
    
    try {
        const user = await getUserById(userId);
        if (!user) return { success: false, message: 'Usuario no encontrado.' };
        const familyHeadUid = user.role === 'hijo' && user.parentUid ? user.parentUid : userId;

        const salidaRef = doc(db, 'users', familyHeadUid, 'salidas', salidaId);
        await updateDoc(salidaRef, {
            participantIds: participantIds
        });
        revalidatePath(`/salidas/${salidaId}`);
        return { success: true, message: "Participantes actualizados." };
    } catch (error) {
        console.error("Error updating participants:", error);
        return { success: false, message: "Error del servidor." };
    }
}


// --- Itinerary Actions ---

export async function getSalidaById(salidaId: string, userId: string) {
    if (!userId || !salidaId) return null;
    try {
        const user = await getUserById(userId);
        if (!user) return null;
        const familyHeadUid = user.role === 'hijo' && user.parentUid ? user.parentUid : userId;

        const salidaDocRef = doc(db, 'users', familyHeadUid, 'salidas', salidaId);
        const salidaSnap = await getDoc(salidaDocRef);
        if (salidaSnap.exists()) {
            const data = salidaSnap.data();
            return {
                id: salidaSnap.id,
                participantIds: data.participantIds || [],
                dateRange: {
                    from: (data.dateRange.from).toDate(),
                    to: data.dateRange.to ? (data.dateRange.to).toDate() : null,
                },
                 evaluationSubmitted: data.evaluationSubmitted || false,
                 shareToken: data.shareToken || null,
                 isPublic: data.isPublic || false,
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching salida by ID:", error);
        return null;
    }
}

export async function getConfirmedPaidActivities(salidaId: string, userId: string): Promise<Activity[]> {
  if (!userId || !salidaId) return [];
  try {
    const user = await getUserById(userId);
    if (!user) return [];
    const familyHeadUid = user.role === 'hijo' && user.parentUid ? user.parentUid : userId;

    const activitiesRequestRef = collection(db, 'users', familyHeadUid, 'salidas', salidaId, 'actividades');
    const q = query(activitiesRequestRef, where('status', 'in', ['matched', 'selected_by_parent']), where('paid', '==', true));
    const querySnapshot = await getDocs(q);

    const activityIds = querySnapshot.docs.map(doc => doc.id);

    if (activityIds.length === 0) return [];
    
    const activitiesRef = collection(db, 'activities');
    const activitiesQuery = query(activitiesRef, where('__name__', 'in', activityIds));
    const activitiesSnapshot = await getDocs(activitiesQuery);

    return activitiesSnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const plainData: { [key: string]: any } = {};
      for (const key in data) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
              const value = data[key];
              if (value instanceof Timestamp) plainData[key] = value.toDate();
              else plainData[key] = value;
          }
      }
      return { id: docSnap.id, ...plainData } as Activity;
    });

  } catch (error) {
    console.error('Error fetching confirmed paid activities:', error);
    return [];
  }
}

export async function getItinerary(salidaId: string, userId: string): Promise<ItineraryEvent[] | null> {
    if (!userId || !salidaId) return null;
    try {
        const user = await getUserById(userId);
        if (!user) return null;
        const familyHeadUid = user.role === 'hijo' && user.parentUid ? user.parentUid : userId;

        const itineraryRef = collection(db, 'users', familyHeadUid, 'salidas', salidaId, 'itinerary');
        const q = query(itineraryRef, orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }
        return querySnapshot.docs.map(doc => doc.data() as ItineraryEvent);
    } catch (error) {
        console.error("Error fetching itinerary:", error);
        return null;
    }
}

export async function saveItinerary(salidaId: string, userId: string, itinerary: ItineraryEvent[]): Promise<{success: boolean, message: string}> {
    if (!userId || !salidaId) {
        return { success: false, message: "Faltan datos para guardar el itinerario." };
    }

    try {
        const user = await getUserById(userId);
        if (!user) return { success: false, message: 'Usuario no encontrado.' };
        const familyHeadUid = user.role === 'hijo' && user.parentUid ? user.parentUid : userId;

        const batch = writeBatch(db);
        const itineraryRef = collection(db, 'users', familyHeadUid, 'salidas', salidaId, 'itinerary');

        const existingDocsSnap = await getDocs(itineraryRef);
        existingDocsSnap.forEach(doc => {
            batch.delete(doc.ref);
        });

        itinerary.forEach(event => {
            const { activityDetails, ...eventToSave } = event;
            const newEventRef = doc(itineraryRef, event.id);
            batch.set(newEventRef, eventToSave);
        });

        await batch.commit();
        revalidatePath(AppRoutes.salidas.itinerario(salidaId));
        return { success: true, message: "Itinerario guardado correctamente." };
    } catch (error) {
        console.error("Error saving itinerary:", error);
        return { success: false, message: "Error del servidor al guardar el itinerario." };
    }
}


// --- Evaluation Actions ---

export type EvaluationFormState = {
  message: string;
  success: boolean;
  errors?: {
    general?: string[];
  };
};


export async function saveEvaluationAction(
  prevState: EvaluationFormState,
  formData: FormData
): Promise<EvaluationFormState> {
  const userId = formData.get('userId') as string;
  const salidaId = formData.get('salidaId') as string;
  const evaluationDataString = formData.get('evaluationData') as string;

  if (!userId || !salidaId || !evaluationDataString) {
    return { success: false, message: "Faltan datos para guardar la evaluación." };
  }

  try {
    const user = await getUserById(userId);
    if (!user) return { success: false, message: 'Usuario no encontrado.' };
    const familyHeadUid = user.role === 'hijo' && user.parentUid ? user.parentUid : userId;
    
    const evaluationData: FullEvaluation = JSON.parse(evaluationDataString);
    if (!evaluationData.activities || !evaluationData.overall) {
       return { success: false, message: "Los datos de la evaluación están incompletos." };
    }

    const batch = writeBatch(db);
    const evaluationRef = doc(collection(db, 'users', familyHeadUid, 'salidas', salidaId, 'evaluations'));
    batch.set(evaluationRef, {
      ...evaluationData,
      createdAt: serverTimestamp(),
    });
    const salidaRef = doc(db, 'users', familyHeadUid, 'salidas', salidaId);
    batch.update(salidaRef, { evaluationSubmitted: true });

    await batch.commit();
    revalidatePath(AppRoutes.salidas.evaluacion(salidaId));
    return { success: true, message: '¡Gracias! Tu evaluación ha sido guardada.' };

  } catch (error) {
    console.error("Error saving evaluation:", error);
    return { success: false, message: 'Error del servidor al guardar la evaluación.' };
  }
}

export async function getEvaluation(salidaId: string, userId: string): Promise<FullEvaluation | null> {
    if (!userId || !salidaId) return null;
    try {
        const user = await getUserById(userId);
        if (!user) return null;
        const familyHeadUid = user.role === 'hijo' && user.parentUid ? user.parentUid : userId;

        const evaluationRef = collection(db, 'users', familyHeadUid, 'salidas', salidaId, 'evaluations');
        const q = query(evaluationRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return null;
        
        const evaluationDoc = querySnapshot.docs[0];
        const data = evaluationDoc.data();
        
        return { activities: data.activities, overall: data.overall };

    } catch (error) {
        console.error("Error fetching evaluation:", error);
        return null;
    }
}

// --- Bitacora Actions ---

export async function getBitacoraEvents(salidaId: string, userId: string): Promise<BitacoraEvent[]> {
  if (!userId || !salidaId) return [];
  try {
    const user = await getUserById(userId);
    if (!user) return [];
    const familyHeadUid = user.role === 'hijo' && user.parentUid ? user.parentUid : userId;

    const eventsRef = collection(db, 'users', familyHeadUid, 'salidas', salidaId, 'bitacora');
    const q = query(eventsRef, orderBy('timestamp', 'asc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            timestamp: (data.timestamp as Timestamp).toDate().toISOString()
        } as BitacoraEvent;
    });

  } catch (error) {
    console.error('Error fetching bitacora events:', error);
    return [];
  }
}

export async function addBitacoraEventAction(formData: FormData): Promise<{success: boolean; message: string;}> {
  const userId = formData.get('userId') as string;
  const salidaId = formData.get('salidaId') as string;
  const type = formData.get('type') as BitacoraEventType;
  const text = formData.get('text') as string | null;
  const file = formData.get('file') as File | null;

  if (!userId || !salidaId || !type) {
    return { success: false, message: 'Faltan datos para añadir el evento.' };
  }
  
  try {
    const user = await getUserById(userId);
    if (!user) return { success: false, message: 'Usuario no encontrado.' };
    const familyHeadUid = user.role === 'hijo' && user.parentUid ? user.parentUid : userId;

    const newEvent: Partial<BitacoraEvent> = {
      type,
      text: text || '',
      timestamp: new Date().toISOString(),
    };
    
    if (file && file.size > 0) {
        const storagePath = `recuerdos/${salidaId}/bitacora/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);
        newEvent.imageUrl = await getDownloadURL(storageRef);
    }
    
    // Add to Firestore
    const eventsRef = collection(db, 'users', familyHeadUid, 'salidas', salidaId, 'bitacora');
    await addDoc(eventsRef, {
        ...newEvent,
        timestamp: serverTimestamp(),
    });

    revalidatePath(AppRoutes.salidas.bitacora(salidaId));
    return { success: true, message: 'Evento añadido a la bitácora.' };
    
  } catch (error) {
    console.error('Error adding bitacora event:', error);
    return { success: false, message: 'Error del servidor al añadir el evento.' };
  }
}
