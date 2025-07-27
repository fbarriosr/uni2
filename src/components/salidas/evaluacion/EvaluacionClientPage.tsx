
'use client';

import { useState, useEffect, useActionState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Loader2, Calendar, CheckCircle } from 'lucide-react';
import SalidaPageHeader from '../SalidaPageHeader'; // Import the new header
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import ActivityEvaluationCard from './ActivityEvaluationCard';
import OverallEvaluationCard from './OverallEvaluationCard';
import type { Activity, FullEvaluation, UserRole } from '@/lib/types';
import { saveEvaluationAction, getEvaluation, getConfirmedPaidActivities } from '@/lib/actions/salidaActions';
import { getUserById } from '@/lib/data';


interface SalidaData {
  id: string;
  dateRange: {
    from: Date;
    to: Date | null;
  };
  evaluationSubmitted?: boolean;
}

export default function EvaluacionClientPage({ salidaId }: { salidaId: string }) {
  const { toast } = useToast();
  const [salidaData, setSalidaData] = useState<SalidaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [viewMode, setViewMode] = useState(false);
  
  const [activitiesToEvaluate, setActivitiesToEvaluate] = useState<Activity[]>([]);
  const [activityEvals, setActivityEvals] = useState<Record<string, { parentRating: number; childRating: number; comment: string }>>({});
  const [overallEval, setOverallEval] = useState({ overallRating: 0, bestMoment: '', generalComment: '' });

  const initialState: { message: string; success: boolean; errors?: any } = { message: '', success: false };
  const [state, formAction, isPending] = useActionState(saveEvaluationAction, initialState);

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? "Éxito" : "Error",
        description: state.message,
        variant: state.success ? "default" : "destructive",
      });
      if (state.success) {
        setViewMode(true);
      }
    }
  }, [state, toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if(currentUser) {
          const appUser = await getUserById(currentUser.uid);
          setUserRole(appUser?.role || null);
      } else {
          setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (!user || !salidaId) return;

    const fetchPageData = async () => {
      setLoading(true);
      try {
        const userDoc = await getUserById(user.uid);
        const familyHeadUid = userDoc?.role === 'hijo' && userDoc.parentUid ? userDoc.parentUid : user.uid;
        if (!familyHeadUid) {
          toast({ title: "Error", description: "No se pudo determinar el grupo familiar.", variant: "destructive" });
          setLoading(false);
          return;
        }

        const salidaDocRef = doc(db, 'users', familyHeadUid, 'salidas', salidaId);
        const salidaSnap = await getDoc(salidaDocRef);
        
        if (salidaSnap.exists()) {
          const data = salidaSnap.data();
          const salida = {
            id: salidaSnap.id,
            dateRange: {
              from: (data.dateRange.from as Timestamp).toDate(),
              to: data.dateRange.to ? (data.dateRange.to as Timestamp).toDate() : null,
            },
            evaluationSubmitted: data.evaluationSubmitted || false,
          };
          setSalidaData(salida);
          
          const confirmedActivities = await getConfirmedPaidActivities(salidaId, user.uid);
          setActivitiesToEvaluate(confirmedActivities);

          if (salida.evaluationSubmitted) {
            setViewMode(true);
            const fetchedEvaluation = await getEvaluation(salidaId, user.uid);
            if (fetchedEvaluation) {
              const actEvals: typeof activityEvals = {};
              fetchedEvaluation.activities.forEach(act => {
                actEvals[act.activityId] = { parentRating: act.parentRating, childRating: act.childRating, comment: act.comment };
              });
              setActivityEvals(actEvals);
              setOverallEval(fetchedEvaluation.overall);
            }
          } else {
            const initialEvals: typeof activityEvals = {};
            confirmedActivities.forEach(act => {
              initialEvals[act.id] = { parentRating: 0, childRating: 0, comment: '' };
            });
            setActivityEvals(initialEvals);
          }
        } else {
          setSalidaData(null);
        }
      } catch (error) {
        console.error("Error fetching salida data:", error);
        toast({ title: "Error", description: "No se pudo cargar la información de la salida.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [user, salidaId, toast]);

  const handleActivityEvalChange = (activityId: string, field: keyof typeof activityEvals[string], value: any) => {
    setActivityEvals(prev => ({
      ...prev,
      [activityId]: { ...(prev[activityId] || {}), [field]: value }
    }));
  };

  const handleOverallEvalChange = (field: keyof typeof overallEval, value: any) => {
    setOverallEval(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  if (!salidaData) {
    return <div className="container mx-auto py-8 text-center"><h1 className="text-2xl font-bold">Salida no encontrada</h1></div>;
  }
  
  const formattedDate = format(salidaData.dateRange.from, 'd MMMM yyyy', { locale: es });

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <SalidaPageHeader
        title="Evalúa tu Experiencia"
        subtitle={formattedDate}
        salidaId={salidaId}
        userId={user?.uid || null}
        currentStep={6}
      />

      <form action={formAction}>
        {/* Hidden inputs to pass necessary IDs and data to the server action */}
        <input type="hidden" name="userId" value={user?.uid || ''} />
        <input type="hidden" name="salidaId" value={salidaId} />
        <input type="hidden" name="evaluationData" value={JSON.stringify({ activities: Object.entries(activityEvals).map(([activityId, evals]) => ({ activityId, ...evals })), overall: overallEval })} />

        <div className="space-y-8">
          <div>
              <h2 className="text-2xl font-headline text-primary mb-4">Actividades Realizadas</h2>
              <div className="space-y-6">
                  {activitiesToEvaluate.map(activity => (
                      <ActivityEvaluationCard 
                        key={activity.id} 
                        activity={activity}
                        parentRating={activityEvals[activity.id]?.parentRating || 0}
                        onParentRatingChange={(r) => handleActivityEvalChange(activity.id, 'parentRating', r)}
                        childRating={activityEvals[activity.id]?.childRating || 0}
                        onChildRatingChange={(r) => handleActivityEvalChange(activity.id, 'childRating', r)}
                        comment={activityEvals[activity.id]?.comment || ''}
                        onCommentChange={(c) => handleActivityEvalChange(activity.id, 'comment', c)}
                        disabled={viewMode || isPending}
                        userRole={userRole}
                      />
                  ))}
              </div>
          </div>

          <div>
              <h2 className="text-2xl font-headline text-primary mb-4">Evaluación General de la Salida</h2>
              <OverallEvaluationCard 
                overallRating={overallEval.overallRating}
                onOverallRatingChange={(r) => handleOverallEvalChange('overallRating', r)}
                bestMoment={overallEval.bestMoment}
                onBestMomentChange={(c) => handleOverallEvalChange('bestMoment', c)}
                generalComment={overallEval.generalComment}
                onGeneralCommentChange={(c) => handleOverallEvalChange('generalComment', c)}
                disabled={viewMode || isPending}
                userRole={userRole}
              />
          </div>
        </div>
        
        <div className="mt-12 flex justify-center">
          <Button size="lg" type="submit" disabled={viewMode || isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {viewMode ? <><CheckCircle className="mr-2 h-4 w-4" />Evaluación Enviada</> : 'Enviar Evaluación'}
          </Button>
        </div>
      </form>
    </div>
  );
}
