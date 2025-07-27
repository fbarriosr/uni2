
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, Timestamp, collection, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSearchParams } from 'next/navigation';

import type { Activity, RequestedActivity, UserRole, User } from '@/lib/types';
import { Loader2, ThumbsUp, Wallet } from 'lucide-react';
import SalidaPageHeader from './SalidaPageHeader'; // Import the new header
import MatchVoteCard from './MatchVoteCard';
import MatchSummary from './MatchSummary';
import { useToast } from '@/hooks/use-toast';
import { recordVoteForActivity, confirmActivityByParentAction, removeActivityFromSummary } from '@/lib/actions/salidaActions';
import { getUserById, getUsersByIds } from '@/lib/data';

interface MatchPageClientProps {
  salidaId: string;
  allActivities: Activity[];
}

interface SalidaData {
  id: string;
  dateRange: {
    from: Date;
    to: Date | null;
  };
  participantIds: string[];
}

export default function MatchPageClient({ salidaId, allActivities }: MatchPageClientProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [salidaData, setSalidaData] = useState<SalidaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [requestedActivities, setRequestedActivities] = useState<RequestedActivity[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchPageData = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const loggedInUser = await getUserById(userId);
      if (!loggedInUser) {
          toast({ title: "Error", description: "No se pudo encontrar el perfil del usuario.", variant: "destructive" });
          return;
      }
      setUserRole(loggedInUser.role);

      const familyHeadUid = loggedInUser.role === 'hijo' && loggedInUser.parentUid ? loggedInUser.parentUid : userId;
      
      const salidaDocRef = doc(db, 'users', familyHeadUid, 'salidas', salidaId);
      const activitiesRequestRef = collection(db, 'users', familyHeadUid, 'salidas', salidaId, 'actividades');

      const [salidaSnap, activitiesSnap] = await Promise.all([
          getDoc(salidaDocRef),
          getDocs(activitiesRequestRef)
      ]);

      if (salidaSnap.exists()) {
        const data = salidaSnap.data();
        const participantIds = data.participantIds || []; // Fetching participant IDs from the outing
        
        // Ensure the family head is always included in the participants list for this context
        const allParticipantIds = Array.from(new Set([familyHeadUid, ...participantIds]));
        
        setSalidaData({
          id: salidaSnap.id,
          dateRange: {
            from: (data.dateRange.from as Timestamp).toDate(),
            to: data.dateRange.to ? (data.dateRange.to as Timestamp).toDate() : null,
          },
          participantIds: allParticipantIds,
        });

        const fetchedParticipants = await getUsersByIds(allParticipantIds);
        setParticipants(fetchedParticipants);

        const reqActivitiesData = activitiesSnap.docs.map(docSnap => {
            const activityDetails = allActivities.find(a => a.id === docSnap.id);
            return {
                id: docSnap.id,
                status: docSnap.data().status || 'pending',
                requestedAt: (docSnap.data().requestedAt as Timestamp).toDate().toISOString(),
                paid: docSnap.data().paid || false,
                activityDetails,
                createdByUid: docSnap.data().createdByUid,
                createdByRole: docSnap.data().createdByRole,
                votes: docSnap.data().votes || {},
            } as RequestedActivity;
        }).filter(a => a.activityDetails);
        setRequestedActivities(reqActivitiesData);

      } else {
          setSalidaData(null);
      }
    } catch (error) {
      console.error("Error fetching page data:", error);
      toast({ title: "Error", description: "No se pudo cargar la información de la página.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [salidaId, allActivities, toast]);
  
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const orderId = searchParams.get('order');
    if (paymentStatus === 'success' && orderId) {
      toast({
        title: "¡Pago Exitoso!",
        description: `Tu pago para la orden ${orderId} fue procesado correctamente.`,
      });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if(currentUser) {
          fetchPageData(currentUser.uid);
      } else {
          setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [fetchPageData]);


  const { activitiesToVoteOn, confirmedActivitiesForSummary } = useMemo(() => {
    const toVote: RequestedActivity[] = [];
    const confirmed: RequestedActivity[] = [];
    
    requestedActivities.forEach(req => {
      if (req.status === 'matched' || req.status === 'selected_by_parent') {
        confirmed.push(req);
      } else {
        toVote.push(req);
      }
    });
    return { activitiesToVoteOn: toVote, confirmedActivitiesForSummary: confirmed };
  }, [requestedActivities]);

  const handleVote = async (activityId: string, vote: 'liked' | 'disliked') => {
    if (!user || isUpdating) return;
    setIsUpdating(activityId);
    
    const result = await recordVoteForActivity(salidaId, activityId, user.uid, vote);
    
    if (result.success) {
        toast({ title: "Voto registrado", description: result.message });
        await fetchPageData(user.uid); // Refetch data to get the latest status
    } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsUpdating(null);
  };
  
  const handleConfirmByParent = async (activityId: string) => {
    if (!user || isUpdating) return;
    setIsUpdating(activityId);
    
    const result = await confirmActivityByParentAction(salidaId, activityId, user.uid);
    
    if (result.success) {
        toast({ title: "Actividad Confirmada", description: result.message });
        await fetchPageData(user.uid);
    } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsUpdating(null);
  };
  
  const handleRemoveFromSummary = async (activityId: string) => {
    if (!user || isUpdating) return;
    setIsUpdating(activityId);

    const result = await removeActivityFromSummary(salidaId, activityId, user.uid);

    if (result.success) {
        toast({ title: "Actividad Devuelta", description: "La actividad ha sido devuelta a la sección de votación." });
        await fetchPageData(user.uid);
    } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsUpdating(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  if (!salidaData) {
    return <div className="container mx-auto py-8 text-center"><h1 className="text-2xl font-bold">Salida no encontrada</h1></div>;
  }
  
  const formattedDateRange = `Para el ${format(salidaData.dateRange.from, 'd MMMM yyyy', { locale: es })}`;
  const hasConfirmedActivities = confirmedActivitiesForSummary.length > 0;
  const pageTitle = hasConfirmedActivities ? "¡Tenemos un Plan!" : "Match de Actividades";

  return (
    <div className="container mx-auto py-8 px-4">
      <SalidaPageHeader
        title={pageTitle}
        subtitle={formattedDateRange}
        salidaId={salidaId}
        userId={user?.uid || null}
        currentStep={3}
      />
      
      <div className="space-y-12">
        <section>
          <div className="flex items-center gap-3 mb-4">
            <ThumbsUp className="h-7 w-7 text-primary" />
            <h2 className="text-2xl font-headline text-primary">
              Actividades Propuestas
            </h2>
          </div>
           {activitiesToVoteOn.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {activitiesToVoteOn.map(req => (
                    <MatchVoteCard
                      key={req.id}
                      request={req}
                      salidaId={salidaId}
                      onVote={handleVote}
                      onConfirmByParent={handleConfirmByParent}
                      isUpdating={isUpdating === req.id}
                      currentUserId={user?.uid}
                      currentUserRole={userRole}
                      participants={participants}
                    />
                ))}
            </div>
          ) : <p className="text-muted-foreground text-center py-10 bg-muted rounded-lg">¡Excelente! Ya no hay actividades pendientes de votación.</p>}
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="h-7 w-7 text-primary" />
            <h2 className="text-2xl font-headline text-primary">Resumen del Plan</h2>
          </div>
          <MatchSummary 
            confirmedActivities={confirmedActivitiesForSummary}
            onRemoveActivity={handleRemoveFromSummary}
            isUpdating={!!isUpdating}
            salidaId={salidaId}
            userRole={userRole}
          />
        </section>
      </div>
    </div>
  );
}
