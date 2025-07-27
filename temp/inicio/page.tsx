
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import dynamic from 'next/dynamic';

import type { Activity, User } from '../lib/types';
import { getUserById, getUsersByIds, getActivities, getActivityById } from '../lib/data';

import InicioHeroSection from '@/components/inicio/InicioHeroSection';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import HorizontalCardCarousel from '@/components/HorizontalCardCarousel';

// Interfaces for processing outings
interface SalidaPlan {
  id: string;
  dateRange: { from: Date; to: Date | null };
  createdAt: Date;
  participantIds: string[];
  activity?: Activity | null;
  isSpecialHighlight?: boolean;
  participantAvatarUrls?: string[];
}

interface OutingDisplayItem {
  id: string;
  title: string;
  date: string;
  imageUrl: string;
  aiHint?: string;
  activityId?: string;
  salidaId?: string;
  isSpecialHighlight?: boolean;
  participantAvatarUrls?: string[];
}

const UpcomingOutingsSection = dynamic(() => import('@/components/inicio/UpcomingOutingsSection'), { ssr: false });
const CalendarDisplay = dynamic(() => import('@/components/CalendarDisplay'), { ssr: false });

export default function InicioPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [allOutings, setAllOutings] = useState<OutingDisplayItem[]>([]);
  const [upcomingOutings, setUpcomingOutings] = useState<OutingDisplayItem[]>([]);
  const [pastOutings, setPastOutings] = useState<OutingDisplayItem[]>([]);
  const [imageHighlights, setImageHighlights] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);

  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date());

  const processOutings = useCallback((allPlans: SalidaPlan[], clientNow: Date): [OutingDisplayItem[], OutingDisplayItem[], any[], any[]] => {
    const upcoming: OutingDisplayItem[] = [];
    const past: OutingDisplayItem[] = [];
    const highlights: any[] = [];
    const birthdayList: any[] = [];

    allPlans.forEach(plan => {
      const isPast = plan.dateRange.from < clientNow;
      const imageUrl = plan.activity?.mainImage || 'https://placehold.co/600x800.png?text=Sin%0AActividad';
      const imageHint = plan.activity?.mainImage ? 'activity photo' : 'outing plan no activity';

      const displayItem: OutingDisplayItem = {
        id: plan.id,
        title: plan.activity?.name || `Plan del ${format(plan.dateRange.from, "P", { locale: es })}`,
        date: format(plan.dateRange.from, "dd MMM yyyy", { locale: es }).toUpperCase(),
        imageUrl: imageUrl,
        aiHint: imageHint,
        salidaId: plan.id,
        activityId: plan.activity?.id,
        isSpecialHighlight: plan.isSpecialHighlight,
        participantAvatarUrls: plan.participantAvatarUrls,
      };

      if (isPast) {
        past.push(displayItem);
      } else {
        upcoming.push(displayItem);
      }
      
      highlights.push({
          date: format(plan.dateRange.from, "dd MMM yyyy", { locale: es }),
          imageUrl: imageUrl,
          aiHint: imageHint,
          isSpecialHighlight: plan.isSpecialHighlight,
          isPast,
      });
    });

    return [upcoming, past, highlights, birthdayList];
  }, []);

  const fetchPageData = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const loggedInUser = await getUserById(uid);
      setAppUser(loggedInUser || null);

      if (!loggedInUser) {
        setError("No se pudo cargar tu perfil de usuario.");
        setLoading(false);
        return;
      }

      const familyHeadUid = loggedInUser.role === 'hijo' && loggedInUser.parentUid ? loggedInUser.parentUid : uid;

      if (!familyHeadUid) {
        setLoading(false);
        return;
      }
      
      const familyMembersMap = new Map<string, User>();
      const parentUser = await getUserById(familyHeadUid);
      if (parentUser) {
          const allMemberIds = [parentUser.id, ...(parentUser.familyMembers || [])];
          const uniqueMemberIds = Array.from(new Set(allMemberIds));
          if (uniqueMemberIds.length > 0) {
              const allFamilyMembers = await getUsersByIds(uniqueMemberIds);
              allFamilyMembers.forEach(member => familyMembersMap.set(member.id, member));
          }
      }

      const outingsRef = collection(db, 'users', familyHeadUid, 'salidas');
      const q = query(outingsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const clientNow = new Date();
      clientNow.setHours(0,0,0,0);

      const allPlansPromises: Promise<SalidaPlan>[] = querySnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        
        let fetchedActivity: Activity | null = null;
        const activitiesRequestRef = collection(db, 'users', familyHeadUid, 'salidas', docSnap.id, 'actividades');
        const requestQuery = query(activitiesRequestRef, orderBy('requestedAt', 'desc'));
        const requestSnapshot = await getDocs(requestQuery);
        
        if (!requestSnapshot.empty) {
            const firstActivityId = requestSnapshot.docs[0].id;
            fetchedActivity = await getActivityById(firstActivityId) || null;
        }

        const participantIds = data.participantIds || [];
        const participantAvatarUrls = participantIds
            .map((id: string) => familyMembersMap.get(id)?.avatarUrl)
            .filter((url?: string): url is string => !!url);

        return {
          id: docSnap.id,
          dateRange: { from: (data.dateRange.from as Timestamp).toDate(), to: data.dateRange.to ? (data.dateRange.to as Timestamp).toDate() : null },
          createdAt: (data.createdAt as Timestamp).toDate(),
          participantIds,
          activity: fetchedActivity,
          participantAvatarUrls,
        };
      });

      let allPlans = await Promise.all(allPlansPromises);

      // Identify and mark the most immediate upcoming outing
      const now = new Date();
      let nextOutingIndex = -1;
      let minDiff = Infinity;
      allPlans.forEach((plan, index) => {
          if (plan.dateRange.from >= now) {
              const diff = plan.dateRange.from.getTime() - now.getTime();
              if (diff < minDiff) {
                  minDiff = diff;
                  nextOutingIndex = index;
              }
          }
      });
      if (nextOutingIndex !== -1) {
          allPlans[nextOutingIndex].isSpecialHighlight = true;
      }

      const [upcoming, past, highlights, birthdayList] = processOutings(allPlans, clientNow);
      
      const currentYear = new Date().getFullYear();
      familyMembersMap.forEach(member => {
        if (member.birthday && member.name) {
          const birthDate = new Date(member.birthday);
          const month = birthDate.getMonth();
          const day = birthDate.getDate();
          birthdayList.push({ date: new Date(currentYear, month, day), name: member.name });
          birthdayList.push({ date: new Date(currentYear + 1, month, day), name: member.name });
        }
      });

      setAllOutings([...upcoming, ...past]);
      setUpcomingOutings(upcoming);
      setPastOutings(past);
      setImageHighlights(highlights);
      setBirthdays(birthdayList);

    } catch (err) {
      console.error(err);
      setError('Error al cargar la información de tus salidas.');
    } finally {
      setLoading(false);
    }
  }, [processOutings]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchPageData(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [fetchPageData]);

  const mostImmediateOuting = useMemo(() => {
    return upcomingOutings.find(o => o.isSpecialHighlight) || null;
  }, [upcomingOutings]);

  return (
    <div className="container mx-auto py-8">
      {loading ? (
        <div className="px-4"><Skeleton className="h-48 w-full rounded-2xl" /></div>
      ) : (
        <InicioHeroSection outing={mostImmediateOuting} userRole={appUser?.role} />
      )}

      {error && (
        <Alert variant="destructive" className="my-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && (
        <div className="space-y-12">
          <UpcomingOutingsSection
            title="Próximas Aventuras"
            items={upcomingOutings}
            isLoading={loading}
            emptyMessage="No tienes planes futuros. ¡Es hora de crear uno!"
          />
          
          <div className="px-4">
             <CalendarDisplay
                mode="default"
                month={currentDisplayMonth}
                numberOfMonths={1}
                handlePrevMonth={() => setCurrentDisplayMonth(subMonths(currentDisplayMonth, 1))}
                handleNextMonth={() => setCurrentDisplayMonth(addMonths(currentDisplayMonth, 1))}
                imageHighlightData={imageHighlights}
                birthdayInfo={birthdays}
              />
          </div>

          <HorizontalCardCarousel
            title="Recuerdos de Salidas Pasadas"
            items={pastOutings}
            isLoading={loading}
            emptyMessage="Aquí aparecerán tus aventuras una vez completadas."
          />
        </div>
      )}
    </div>
  );
}
