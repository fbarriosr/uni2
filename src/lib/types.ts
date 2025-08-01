
export type ActivityCategory = "Solo para ustedes" | "Ideas rápidas" | "Libre y gratuito";
export type ActivityStatus = 'borrador' | 'pendiente_revision' | 'publicada' | 'deshabilitada';

export interface Activity {
  id: string;
  name: string;
  description: string;
  location: string;
  price: number; // 0 for free
  category: ActivityCategory;
  status: ActivityStatus;
  facilities: string[];
  mainImage?: string;
  galleries?: string[];
  recommendations?: string; // Optional, could be tips or notes
  averageRating?: number;
  duration?: string; // e.g., "2-3 hours"
  schedule?: string; // e.g., "Lunes a Viernes: 09:00 - 18:00"
  latitude?: number; // Optional latitude
  longitude?: number; // Optional longitude
  comments?: string[];
  iaComment?: string; // Nuevo campo para el comentario generado por IA
  textEmbedding?: number[]; // Campo para almacenar el embedding del texto de la actividad
}

export interface Comment {
  id: string;
  name: string;
  avatar: string;
  commet: string;
}

export type ActivityRequestStatus =
  | 'pending' // Awaiting votes
  | 'matched' // A parent and child both liked it
  | 'rejected' // A parent rejected it
  | 'selected_by_parent'; // Parent override

export interface RequestedActivity {
  id: string; // This is the activityId
  status: ActivityRequestStatus;
  requestedAt: string;
  activityDetails?: Activity;
  paid?: boolean;

  // New fields for extended match logic
  createdByUid: string;
  createdByRole: UserRole;
  votes: Record<string, 'liked' | 'disliked'>; // Key: userId, Value: vote
}


export interface ActivityFilterCriteria {
  location?: string;
  price?: "free" | "paid" | "any";
  category?: ActivityCategory | "any";
  search?: string;
  averageRating?: number;
}

export interface PastActivityRating {
  activityId: string;
  activityName: string;
  rating: number; // e.g., 1-5
  notes?: string;
}

// User Management Types
export type UserRole = 'admin' | 'user' | 'hijo' | 'amigo';

export const USER_ROLES: UserRole[] = ['admin', 'user', 'hijo', 'amigo'];

export interface Address {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface User {
  id: string;
  name?: string;
  nickname?: string; // Added nickname
  email?: string; // Changed to optional
  passwordHash?: string; // Changed to optional
  role: UserRole;
  createdAt?: string; // Changed to string
  avatarUrl?: string; // Added avatarUrl
  birthday?: string; // Changed to string
  gender?: 'male' | 'female' | 'other';
  familyMembers?: string[];
  parentUid?: string; // Added to link child to parent
  status?: 'invited' | 'active'; // Added for invitation flow
  theme?: string;
  fontPair?: string;
  addresses?: Address[];
  activeAddressId?: string | null;
  isAdmin?: boolean;
}

// User Outings Type
export type SalidaStatus = 'planificada' | 'en_curso' | 'completada' | 'cancelada';

export type BitacoraEventType = 'inicio' | 'fin' | 'comentario' | 'foto' | 'audio';

export interface BitacoraEvent {
    id: string;
    timestamp: string; // ISO String
    type: BitacoraEventType;
    text?: string;
    imageUrl?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
}

export interface UserOuting {
  id: string;
  userId: string;
  activityId: string;
  activityName: string;
  activityLocation: string;
  activityImage?: string; // Main image of the activity
  outingDate: string; // Changed to string
  status: SalidaStatus; // Changed from 'scheduled' | 'completed' | 'cancelled'
  createdAt: string; // Changed to string
  evaluationSubmitted?: boolean;
  bitacora?: BitacoraEvent[];
  ubicacionInicio?: { latitude: number; longitude: number } | null;
  ubicacionFin?: { latitude: number; longitude: number } | null;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validFrom: string; // Changed to string
  validTo: string; // Changed to string
  isActive: boolean;
  createdAt: string; // Changed to string
  maxUses: number; // Total number of times the coupon can be used
  timesUsed: number; // How many times the coupon has been used
}

export interface Transaction {
  id: string;
  userId: string;
  salidaId: string;
  amount: number;
  status: 'pending' | 'successful' | 'failed' | 'cancelled';
  createdAt: string; // Changed to string
  transbankResponse?: any; // To store the raw response from Transbank
  activityIds?: string[];
  couponCode?: string; // To track which coupon was used
}

export type ItineraryEventType = 'start' | 'travel' | 'activity' | 'meal' | 'end';

export interface ItineraryEvent {
  id: string;
  type: ItineraryEventType;
  time: string;
  title: string;
  order: number;
  date: string; // 'YYYY-MM-DD' format, for multi-day grouping
  description?: string;
  duration?: string;
  icon: string;
  imageUrl?: string;
  aiHint?: string;
  isPlaceholder?: boolean;
  marker?: string; // 'A', 'B', 'C'
  activityId?: string;
  activityDetails?: Activity;
  paid?: boolean;
}

// Evaluation Types
export interface ActivityEvaluation {
  activityId: string;
  parentRating: number;
  childRating: number;
  comment: string;
}

export interface OverallEvaluation {
  overallRating: number;
  bestMoment: string;
  generalComment: string;
}

export interface FullEvaluation {
  activities: ActivityEvaluation[];
  overall: OverallEvaluation;
}

// Agent Type
export interface Agent {
    id: string;
    nombre: string;
    rol: string;
    prompt: string;
    icono_principal: string;
    icono_secundario: string;
}

// Claim Types
export type ClaimStatus = 'pendiente' | 'solucionado';
export const CLAIM_STATUSES: ClaimStatus[] = ['pendiente', 'solucionado'];

export type ClaimType = 'problema_app' | 'problema_actividad' | 'sugerencia' | 'otro';
export const CLAIM_TYPES: ClaimType[] = ['problema_app', 'problema_actividad', 'sugerencia', 'otro'];


export interface Claim {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: ClaimType;
  title: string;
  description: string;
  status: ClaimStatus;
  createdAt: string;
}

// Academia del Vínculo Types
export type ContentStatus = 'active' | 'draft';
export const CONTENT_STATUSES: ContentStatus[] = ['active', 'draft'];

export interface LearningPath {
  id: string;
  title: string;
  coverImage: string;
  status: ContentStatus;
  createdAt: string;
  // progress and lessons will be added later
}

export interface MicroLesson {
  id: string;
  title: string;
  description: string;
  image: string;
  status: ContentStatus;
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  image: string;
  period: 'weekly' | 'monthly';
  status: ContentStatus;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  coverImage: string;
  status: ContentStatus;
  createdAt: string;
  // content and author will be added later
}

export interface Expert {
  id: string;
  name: string;
  specialty: string;
  photo: string;
  lugar_de_trabajo?: string;
  horario?: string;
  descripcion?: string;
  trayectoria?: string;
  comentario_ia?: string;
  comentarios_padres?: string[];
  sitio_web?: string;
  areas_de_practica?: string[]; // Specifically for legal experts
}

export interface SuggestedReading {
    id: string;
    title: string;
    subtitle: string;
    coverImage: string;
    status: ContentStatus;
}
