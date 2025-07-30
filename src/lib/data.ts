

import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import type { Activity, ActivityCategory, User, UserRole, Coupon, Comment, ActivityStatus, Agent, Claim, LearningPath, MicroLesson, Challenge, Article, Expert, SuggestedReading } from './types';
import { USER_ROLES } from './types';


export const activityCategories: ActivityCategory[] = ["Solo para ustedes", "Ideas rápidas", "Libre y gratuito"];
export const activityStatuses: ActivityStatus[] = ['borrador', 'pendiente_revision', 'publicada', 'deshabilitada'];

// --- Activity Management ---

const activitiesCollectionRef = collection(db, 'activities');

// Helper function to safely serialize Firestore data including Timestamps
function serializeData(docSnap: import('firebase/firestore').DocumentSnapshot) {
  const data = docSnap.data();
  if (!data) return null;

  const plainData: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (value instanceof Timestamp) {
        plainData[key] = value.toDate().toISOString(); // Using ISO string is safest
      } else {
        plainData[key] = value;
      }
    }
  }
  
  // If user has isAdmin flag, override role to 'admin'
  if (data.isAdmin === true) {
      plainData.role = 'admin';
  }

  return { id: docSnap.id, ...plainData };
}

/**
 * Fetches activities that are visible to end-users (status is 'publicada').
 */
export async function getActivities(): Promise<Activity[]> {
  try {
    const q = query(activitiesCollectionRef, where("status", "==", "publicada"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => serializeData(docSnap) as Activity);
  } catch (error) {
    console.error("Error fetching published activities: ", error);
    return [];
  }
}

/**
 * Fetches all activities regardless of status, for admin purposes.
 */
export async function getAdminActivities(): Promise<Activity[]> {
  try {
    const querySnapshot = await getDocs(activitiesCollectionRef);
    return querySnapshot.docs.map(docSnap => serializeData(docSnap) as Activity);
  } catch (error) {
    console.error("Error fetching admin activities: ", error);
    return [];
  }
}


export async function getActivityById(id: string): Promise<Activity | undefined> {
  try {
    const docRef = doc(db, 'activities', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return serializeData(docSnap) as Activity;
    }
    return undefined;
  } catch (error) {
    console.error(`Error fetching activity by ID (${id}): `, error);
    return undefined;
  }
}

export async function getActivityComments(activityId: string): Promise<Comment[]> {
  try {
    const commentsCollectionRef = collection(db, 'activities', activityId, 'commets');
    const querySnapshot = await getDocs(commentsCollectionRef);
    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        avatar: data.avatar,
        commet: data.commet,
      } as Comment;
    });
  } catch (error) {
    console.error(`Error fetching comments for activity (${activityId}): `, error);
    return [];
  }
}

export async function addActivity(activityData: Omit<Activity, 'id' | 'averageRating'>): Promise<Activity> {
  const docRef = await addDoc(activitiesCollectionRef, {
    ...activityData,
  });
  return { id: docRef.id, ...activityData, averageRating: undefined };
}

export async function updateActivity(id:string, updates: Partial<Omit<Activity, 'id' | 'averageRating'>>): Promise<Activity | null> {
  const docRef = doc(db, 'activities', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }
  await updateDoc(docRef, updates);
  const updatedDocSnap = await getDoc(docRef);
  return serializeData(updatedDocSnap) as Activity | null;
}

export async function deleteActivity(id: string): Promise<boolean> {
  const docRef = doc(db, 'activities', id);
  await deleteDoc(docRef);
  return true;
}

export async function seedInitialActivities(): Promise<{ success: boolean; message: string; count: number }> {
  const initialActivities: Omit<Activity, 'id'>[] = [
    {
      name: "Aventura en el Cerro San Cristóbal y Teleférico",
      description: "Disfruta de vistas panorámicas de Santiago subiendo en el teleférico o funicular. Ideal para caminatas, picnics y visitar el Zoológico Nacional o la estatua de la Virgen.",
      location: "Pío Nono 450, Recoleta, Santiago",
      price: 3500,
      category: "Solo para ustedes",
      status: "publicada",
      facilities: ["Baños públicos", "Cafeterías", "Miradores", "Zoológico (entrada aparte)", "Piscina Tupahue (temporada)"],
      mainImage: "https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/actividades%2Fparquemet_01.jpg?alt=media&token=c33e4429-a11f-42fa-9e52-1404941e2227",
      recommendations: "Llevar agua, protector solar y sombrero. Ideal ir temprano los fines de semana para evitar multitudes.",
      duration: "3-5 horas",
      schedule: "Martes a Domingo: 10:00 - 18:45 (Teleférico)",
      latitude: -33.4269,
      longitude: -70.6309,
      averageRating: 4,
      comments: [
        "¡Las vistas son espectaculares! Totalmente recomendado.",
        "El teleférico es una gran experiencia para los niños.",
        "Un poco lleno el fin de semana, pero vale la pena.",
        "El zoológico es pequeño pero bien cuidado.",
        "Perfecto para una tarde de picnic en familia.",
        "El funicular es un clásico, muy pintoresco.",
        "No olviden visitar la cumbre y la virgen."
      ],
      iaComment: "Resumen IA: Los visitantes destacan las vistas espectaculares y la experiencia del teleférico, aunque puede haber multitudes. Ideal para picnics y familias."
    },
    {
      name: "Explora la Ciencia en el Museo Interactivo Mirador (MIM)",
      description: "Un espacio donde aprender ciencia es una aventura. Más de 300 módulos interactivos para experimentar y descubrir fenómenos naturales y tecnológicos. Perfecto para todas las edades.",
      location: "Av. Punta Arenas 6711, La Granja, Santiago",
      price: 6000,
      category: "Ideas rápidas",
      status: "publicada",
      facilities: ["Baños", "Cafetería", "Tienda de recuerdos", "Estacionamiento", "Acceso para sillas de ruedas"],
      mainImage: "https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/actividades%2Fmim_01.jpg?alt=media&token=efe7421d-1923-41ac-945b-79463decb3ce",
      recommendations: "Comprar entradas online con anticipación. Destinar al menos 3 horas para recorrerlo.",
      duration: "Medio día",
      schedule: "Martes a Domingo: 09:30 - 17:30 (confirmar horarios)",
      latitude: -33.5296,
      longitude: -70.6124,
      averageRating: 3,
      comments: [
        "A mis hijos les encantó, no querían irse.",
        "Muy educativo y divertido para todas las edades.",
        "Hay mucho que ver y hacer, se necesita tiempo.",
        "Algunos módulos necesitan mantenimiento, pero en general bien.",
        "La cafetería es un poco cara, mejor llevar snacks.",
        "Ideal para un día lluvioso.",
        "Aprendimos mucho y nos divertimos al mismo tiempo.",
        "El personal es amable y dispuesto a ayudar."
      ],
      iaComment: "Resumen IA: Altamente recomendado por su carácter educativo y divertido. Se sugiere dedicar tiempo y considerar llevar snacks."
    },
    {
      name: "Diversión sin Fin en el Parque Bicentenario de la Infancia",
      description: "Un parque temático diseñado especialmente para niños. Cuenta con casas en los árboles, toboganes gigantes, juegos de agua en verano y más de 60 actividades lúdicas gratuitas.",
      location: "Av. Perú 1001, Recoleta, Santiago",
      price: 0,
      category: "Libre y gratuito",
      status: "publicada",
      facilities: ["Baños", "Zona de picnic", "Juegos de agua (verano)", "Seguridad"],
      mainImage: "https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/actividades%2Fparquebicentenario_01.jpg?alt=media&token=cd4fdb38-0ba6-483d-9d5d-0c144f957b45",
      recommendations: "Ideal para niños de todas las edades. Llevar snacks y agua. Consultar horarios de juegos de agua en temporada.",
      duration: "2-4 horas",
      schedule: "Martes a Domingo: 10:00 - 18:00",
      latitude: -33.4108,
      longitude: -70.6354,
      averageRating: 5,
      comments: [
        "¡Un parque increíble y gratuito! Mis hijos lo amaron.",
        "Los toboganes son gigantes y muy divertidos.",
        "Las casas en los árboles son geniales para explorar.",
        "En verano los juegos de agua son un éxito.",
        "Llevar bloqueador y gorro, hay poca sombra en algunas áreas.",
        "Muy limpio y bien mantenido.",
        "Excelente opción para una salida económica en familia."
      ],
      iaComment: "Resumen IA: Parque gratuito muy popular entre los niños por sus toboganes y casas en los árboles. Se recomienda llevar protección solar."
    },
    {
      name: "Adrenalina y Diversión en Fantasilandia",
      description: "El principal parque de diversiones de Chile. Ofrece una gran variedad de juegos mecánicos, desde montañas rusas emocionantes hasta atracciones familiares y para niños pequeños.",
      location: "Av. Beauchef 938, Santiago Centro",
      price: 19990,
      category: "Solo para ustedes",
      status: "publicada",
      facilities: ["Baños", "Restaurantes", "Tiendas", "Enfermería", "Casilleros"],
      mainImage: "https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/actividades%2Ffantasilandia_01.jpg?alt=media&token=df4af86e-dbf2-434d-a2a9-7ccc93dca1f3",
      recommendations: "Revisar calendario de apertura y comprar entradas online. Medir a los niños para saber a qué juegos pueden subir.",
      duration: "Día completo",
      schedule: "Variable según temporada (consultar web oficial)",
      latitude: -33.4587,
      longitude: -70.6668,
      averageRating: 3,
      comments: [
        "Mucha adrenalina, ¡las montañas rusas son geniales!",
        "Hay juegos para todas las edades, desde los más pequeños.",
        "Las filas pueden ser largas, paciencia.",
        "La comida dentro del parque es cara.",
        "Recomiendo comprar el pase rápido si vas en temporada alta.",
        "Un día completo de diversión garantizada.",
        "El personal es atento y los juegos se ven seguros."
      ],
      iaComment: "Resumen IA: Emocionante parque de diversiones con atracciones para todas las edades, aunque las filas y precios de comida son puntos a considerar."
    },
    {
      name: "Paseo Cultural por Barrio Lastarria y Parque Forestal",
      description: "Disfruta de un paseo por el encantador Barrio Lastarria, con sus cafés, tiendas de diseño y centros culturales. Continúa hacia el Parque Forestal para relajarte, visitar el Museo de Bellas Artes o simplemente disfrutar del aire libre.",
      location: "Barrio Lastarria / Parque Forestal, Santiago Centro",
      price: 0,
      category: "Libre y gratuito",
      status: "publicada",
      facilities: ["Restaurantes y cafés", "Tiendas", "Museos", "Baños públicos (en algunos puntos)", "Áreas verdes"],
      mainImage: "https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/actividades%2Flastarria_01.jpg?alt=media&token=2aecb462-0695-48a0-bc4f-4f9ea8aed040",
      recommendations: "Ideal para un fin de semana. Visitar el GAM (Centro Cultural Gabriela Mistral). Los domingos hay ferias de antigüedades.",
      duration: "Medio día a día completo",
      schedule: "Abierto siempre (horarios de tiendas/museos varían)",
      latitude: -33.4378,
      longitude: -70.6350,
      averageRating: 4,
      comments: [
        "Un barrio con mucho encanto, ideal para caminar.",
        "Los cafés y restaurantes son muy buenos.",
        "El Parque Forestal es perfecto para un descanso.",
        "Visiten el Museo de Bellas Artes, es gratuito algunos días.",
        "Hay muchas tiendas de diseño y librerías interesantes.",
        "Seguro y agradable para pasear en familia.",
        "Encontrar estacionamiento puede ser complicado."
      ],
      iaComment: "Resumen IA: Barrio encantador para pasear con buenos cafés y tiendas. El Parque Forestal ofrece un espacio de relajo. El estacionamiento puede ser un desafío."
    }
  ];

  try {
    const activitiesSnapshot = await getDocs(activitiesCollectionRef);
    if (activitiesSnapshot.empty) {
        const batch = writeBatch(db);
        initialActivities.forEach(activity => {
          const newActivityRef = doc(activitiesCollectionRef);
          const activityDataWithRatingAndComments = {
            ...activity,
            averageRating: activity.averageRating ?? 4,
            comments: activity.comments ?? [],
            iaComment: activity.iaComment ?? "Resumen IA pendiente."
          };
          batch.set(newActivityRef, activityDataWithRatingAndComments);
        });
        await batch.commit();
        return { success: true, message: `${initialActivities.length} actividades iniciales añadidas a Firestore.`, count: initialActivities.length };
    } else {
        return { success: true, message: "La base de datos de actividades no está vacía. No se añadieron datos iniciales.", count: 0 };
    }

  } catch (error) {
    console.error("Error seeding initial activities: ", error);
    return { success: false, message: "Error al intentar añadir actividades iniciales a Firestore.", count: 0 };
  }
}


// --- User Management ---

const usersCollectionRef = collection(db, 'users');

export async function getUsers(): Promise<User[]> {
  try {
    const querySnapshot = await getDocs(usersCollectionRef);
    return querySnapshot.docs.map(docSnap => serializeData(docSnap) as User);
  } catch (error) {
    console.error("Error fetching users: ", error);
    return [];
  }
}

export async function getUsersByIds(ids: string[]): Promise<User[]> {
  if (!ids || ids.length === 0) {
    return [];
  }
  try {
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 30) {
        chunks.push(ids.slice(i, i + 30));
    }

    const userPromises = chunks.map(chunk => {
        const q = query(usersCollectionRef, where('__name__', 'in', chunk));
        return getDocs(q);
    });

    const querySnapshots = await Promise.all(userPromises);
    const users: User[] = [];
    querySnapshots.forEach(snapshot => {
        snapshot.docs.forEach(docSnap => {
            users.push(serializeData(docSnap) as User);
        });
    });
    return users;

  } catch (error) {
    console.error("Error fetching users by IDs: ", error);
    return [];
  }
}

export async function getUserById(id: string): Promise<User | undefined> {
  try {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return serializeData(docSnap) as User;
    }
    return undefined;
  } catch (error) {
    console.error(`Error fetching user by ID (${id}): `, error);
    return undefined;
  }
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  try {
    const q = query(usersCollectionRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return serializeData(docSnap) as User;
    }
    return undefined;
  } catch (error) {
    console.error(`Error fetching user by email (${email}): `, error);
    return undefined;
  }
}

export async function addUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  const dataToSave = {
    ...userData,
    createdAt: serverTimestamp()
  };
  const docRef = await addDoc(usersCollectionRef, dataToSave);

  return { id: docRef.id, ...userData, createdAt: new Date().toISOString() };
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'email'>>): Promise<User | null> {
  const docRef = doc(db, 'users', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }
  await updateDoc(docRef, updates);
  const updatedDocSnap = await getDoc(docRef);
  return serializeData(updatedDocSnap) as User | null;
}

export async function deleteUser(id: string): Promise<boolean> {
  const docRef = doc(db, 'users', id);
  await deleteDoc(docRef);
  return true;
}

// --- Coupon Management ---

const couponsCollectionRef = collection(db, 'coupons');

export async function getCoupons(): Promise<Coupon[]> {
  try {
    const querySnapshot = await getDocs(couponsCollectionRef);
    return querySnapshot.docs.map(docSnap => serializeData(docSnap) as Coupon);
  } catch (error) {
    console.error("Error fetching coupons: ", error);
    return [];
  }
}

export async function getCouponById(id: string): Promise<Coupon | undefined> {
  try {
    const docRef = doc(db, 'coupons', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return serializeData(docSnap) as Coupon;
    }
    return undefined;
  } catch (error) {
    console.error(`Error fetching coupon by ID (${id}): `, error);
    return undefined;
  }
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  if (!code) return null;
  try {
    const now = new Date();
    const q = query(
      couponsCollectionRef,
      where("code", "==", code.toUpperCase()),
      where("isActive", "==", true)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const validCoupons = querySnapshot.docs
      .map(docSnap => serializeData(docSnap) as Coupon)
      .filter(coupon => new Date(coupon.validFrom) <= now && new Date(coupon.validTo) >= now);

    if (validCoupons.length === 0) {
      return null;
    }

    return validCoupons[0];
  } catch (error) {
    console.error(`Error fetching coupon by code (${code}): `, error);
    return null;
  }
}


export async function addCoupon(couponData: Omit<Coupon, 'id' | 'createdAt'>): Promise<Coupon> {
  const dataToSave = {
    ...couponData,
    createdAt: serverTimestamp(),
    validFrom: new Date(couponData.validFrom),
    validTo: new Date(couponData.validTo),
  };
  const docRef = await addDoc(couponsCollectionRef, dataToSave);
  return { id: docRef.id, ...couponData, createdAt: new Date().toISOString() };
}


export async function updateCoupon(id: string, updates: Partial<Omit<Coupon, 'id' | 'createdAt'>>): Promise<Coupon | null> {
  const docRef = doc(db, 'coupons', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }

  const updatesForFirestore: { [key: string]: any } = { ...updates };
  if (updates.validFrom) {
    updatesForFirestore.validFrom = new Date(updates.validFrom);
  }
  if (updates.validTo) {
    updatesForFirestore.validTo = new Date(updates.validTo);
  }

  await updateDoc(docRef, updatesForFirestore);
  const updatedDocSnap = await getDoc(docRef);
  return serializeData(updatedDocSnap) as Coupon | null;
}

export async function deleteCoupon(id: string): Promise<boolean> {
  const docRef = doc(db, 'coupons', id);
  await deleteDoc(docRef);
  return true;
}


// --- Agent Management ---

const agentsCollectionRef = collection(db, 'llm');

export async function getAgents(): Promise<Agent[]> {
  try {
    const querySnapshot = await getDocs(agentsCollectionRef);
    return querySnapshot.docs.map(docSnap => serializeData(docSnap) as Agent);
  } catch (error) {
    console.error("Error fetching agents: ", error);
    return [];
  }
}

export async function addAgent(agentData: Omit<Agent, 'id'>): Promise<Agent> {
  const docRef = await addDoc(agentsCollectionRef, agentData);
  return { id: docRef.id, ...agentData };
}

export async function updateAgent(id: string, updates: Partial<Omit<Agent, 'id'>>): Promise<Agent | null> {
  const docRef = doc(db, 'llm', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }
  await updateDoc(docRef, updates);
  const updatedDocSnap = await getDoc(docRef);
  return serializeData(updatedDocSnap) as Agent | null;
}

export async function deleteAgent(id: string): Promise<boolean> {
  const docRef = doc(db, 'llm', id);
  await deleteDoc(docRef);
  return true;
}

// --- Claim Management ---
const claimsCollectionRef = collection(db, 'claims');

export async function getClaims(): Promise<Claim[]> {
  try {
    const querySnapshot = await getDocs(claimsCollectionRef);
    return querySnapshot.docs.map(docSnap => serializeData(docSnap) as Claim);
  } catch (error) {
    console.error("Error fetching claims: ", error);
    return [];
  }
}

export async function updateClaimStatus(id: string, status: 'pendiente' | 'solucionado'): Promise<Claim | null> {
    const docRef = doc(db, 'claims', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        return null;
    }
    await updateDoc(docRef, { status });
    const updatedDocSnap = await getDoc(docRef);
    return serializeData(updatedDocSnap) as Claim | null;
}


// --- Academia del Vínculo & Legal Data ---

async function getLearningContent<T>(collectionName: string, status: 'active' | 'draft' | 'all'): Promise<T[]> {
  try {
    const collectionRef = collection(db, collectionName);
    const q = status === 'all' ? collectionRef : query(collectionRef, where('status', '==', status));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => serializeData(docSnap) as T);
  } catch (error) {
    console.error(`Error fetching content from ${collectionName}: `, error);
    return [];
  }
}

// Learning Paths
export async function getActiveLearningPaths(): Promise<LearningPath[]> {
  return getLearningContent<LearningPath>('learningPaths', 'active');
}
export async function getLearningPaths(): Promise<LearningPath[]> {
  return getLearningContent<LearningPath>('learningPaths', 'all');
}

// Micro-Lessons
export async function getActiveMicroLessons(): Promise<MicroLesson[]> {
  return getLearningContent<MicroLesson>('vinculos/contenido/micro_lecciones', 'active');
}
export async function getMicroLessons(): Promise<MicroLesson[]> {
  return getLearningContent<MicroLesson>('vinculos/contenido/micro_lecciones', 'all');
}

// Challenges
export async function getActiveChallenges(): Promise<Challenge[]> {
  return getLearningContent<Challenge>('challenges', 'active');
}
export async function getChallenges(): Promise<Challenge[]> {
  return getLearningContent<Challenge>('challenges', 'all');
}

// Articles
export async function getActiveArticles(): Promise<Article[]> {
  return getLearningContent<Article>('articles', 'active');
}
export async function getArticles(): Promise<Article[]> {
  return getLearningContent<Article>('articles', 'all');
}

// Suggested Readings
export async function getActiveSuggestedReadings(): Promise<SuggestedReading[]> {
  return getLearningContent<SuggestedReading>('suggestedReadings', 'active');
}
export async function getSuggestedReadings(): Promise<SuggestedReading[]> {
  return getLearningContent<SuggestedReading>('suggestedReadings', 'all');
}

// Experts
export async function getExperts(): Promise<Expert[]> {
  return getLearningContent<Expert>('expertos_vinculos', 'all');
}

export async function getExpertById(id: string): Promise<Expert | undefined> {
  try {
    const docRef = doc(db, 'expertos_vinculos', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return serializeData(docSnap) as Expert;
    }
    return undefined;
  } catch (error) {
    console.error(`Error fetching expert by ID (${id}): `, error);
    return undefined;
  }
}

// Legal Experts - New function
export async function getLegalExperts(): Promise<Expert[]> {
    return getLearningContent<Expert>('legal_expertos', 'all');
}

export async function getLegalExpertById(id: string): Promise<Expert | undefined> {
  try {
    const docRef = doc(db, 'legal_expertos', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return serializeData(docSnap) as Expert;
    }
    return undefined;
  } catch (error) {
    console.error(`Error fetching legal expert by ID (${id}): `, error);
    return undefined;
  }
}

// --- Public Sharing ---

export async function getSalidaByToken(token: string): Promise<{ salida: any | null, ownerId: string | null }> {
  if (!token) return { salida: null, ownerId: null };

  try {
    const q = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(q);

    for (const userDoc of usersSnapshot.docs) {
      const salidasRef = collection(db, `users/${userDoc.id}/salidas`);
      const salidasQuery = query(salidasRef, where('shareToken', '==', token), where('isPublic', '==', true));
      const salidasSnapshot = await getDocs(salidasQuery);

      if (!salidasSnapshot.empty) {
        const salidaDoc = salidasSnapshot.docs[0];
        return { salida: serializeData(salidaDoc), ownerId: userDoc.id };
      }
    }

    return { salida: null, ownerId: null };
  } catch (error) {
    console.error("Error fetching salida by token:", error);
    return { salida: null, ownerId: null };
  }
}
