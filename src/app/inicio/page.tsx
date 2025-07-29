'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';

import type { Activity, User } from '@/lib/types';
import { getUserById, getUsersByIds, getActivities, getActivityById } from '@/lib/data';

import InicioHeroSection from '@/components/inicio/InicioHeroSection';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import HorizontalCardCarousel from '@/components/HorizontalCardCarousel';
import { Button } from '@/components/ui/button';

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

// Agregar interfaz BirthdayInfo para cumpleaños
interface BirthdayInfo {
  date: Date;
  name: string;
}

// Agregar interfaz ImageHighlight para eventos destacados
interface ImageHighlight {
  date: string; // Formato: "dd MMM yyyy"
  imageUrl: string;
  aiHint: string;
}

const UpcomingOutingsSection = dynamic(() => import('@/components/inicio/UpcomingOutingsSection'), { ssr: false });
const DualMonthCalendar = dynamic(() => import('@/components/DualMonthCalendar'), { ssr: false });

export default function InicioPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [clientReady, setClientReady] = useState(false);
  const [today, setToday] = useState<Date | undefined>();
  const [allOutings, setAllOutings] = useState<OutingDisplayItem[]>([]);
  const [upcomingOutings, setUpcomingOutings] = useState<OutingDisplayItem[]>([]);
  const [pastOutings, setPastOutings] = useState<OutingDisplayItem[]>([]);
  const [imageHighlightData, setImageHighlightData] = useState<ImageHighlight[]>([]);
  const [birthdays, setBirthdays] = useState<BirthdayInfo[]>([]);
  const [upcomingOutingDates, setUpcomingOutingDates] = useState<Date[]>([]);

  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date());

  const processOutings = useCallback((allPlans: SalidaPlan[], clientNow: Date): [OutingDisplayItem[], OutingDisplayItem[], ImageHighlight[]] => {
    const upcoming: OutingDisplayItem[] = [];
    const past: OutingDisplayItem[] = [];
    const highlights: ImageHighlight[] = [];

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
      
      // Solo agregar eventos futuros para el calendario
      if (!isPast && plan.dateRange.from && plan.activity?.mainImage) {
        highlights.push({
          date: format(plan.dateRange.from, "dd MMM yyyy", { locale: es }),
          imageUrl: imageUrl,
          aiHint: imageHint,
        });
      }
    });

    return [upcoming, past, highlights];
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

      // Filtrar SOLO eventos futuros para upcomingOutingDates
      const upcomingDatesOnly: Date[] = allPlans
        .filter(plan => plan.dateRange.from && plan.dateRange.from >= clientNow)
        .map(plan => plan.dateRange.from);
      setUpcomingOutingDates(upcomingDatesOnly);

      const now = new Date();
      let nextOutingIndex = -1;
      let minDiff = Infinity;
      allPlans.forEach((plan, index) => {
          if (plan.dateRange.from && plan.dateRange.from >= now) {
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

      const [upcoming, past, highlights] = processOutings(allPlans, clientNow);
      
      const currentYear = new Date().getFullYear();
      const birthdayList: BirthdayInfo[] = [];
      familyMembersMap.forEach(member => {
        if (member.birthday && member.name) {
          const birthDate = new Date(member.birthday);
          const month = birthDate.getMonth();
          const day = birthDate.getDate();
          // Solo agregar cumpleaños futuros
          const nextBirthday = new Date(currentYear, month, day);
          if (nextBirthday >= clientNow) {
            birthdayList.push({ date: nextBirthday, name: member.name });
          }
        }
      });

      setAllOutings([...upcoming, ...past]);
      setUpcomingOutings(upcoming);
      setPastOutings(past);
      setImageHighlightData(highlights);
      setBirthdays(birthdayList);

    } catch (err) {
      console.error(err);
      setError('Error al cargar la información de tus salidas.');
    } finally {
      setLoading(false);
    }
  }, [processOutings]);

  useEffect(() => {
    setClientReady(true);
    const clientToday = new Date();
    clientToday.setHours(0, 0, 0, 0);
    setToday(clientToday);
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
          <div className="px-4">
             {clientReady && today ? (
               <DualMonthCalendar
                 month={currentDisplayMonth}
                 onMonthChange={setCurrentDisplayMonth}
                 todayDate={today}
                 birthdayInfo={birthdays}
                 upcomingDates={upcomingOutingDates}
                 imageHighlightData={imageHighlightData}
               />
             ) : (
               <div className="bg-card p-4 rounded-xl shadow-lg border">
                 <Skeleton className="h-[550px] w-full" />
               </div>
             )}
          </div>

          <UpcomingOutingsSection
            title="Próximas Aventuras"
            items={upcomingOutings}
            isLoading={loading}
            emptyMessage="No tienes planes futuros. ¡Es hora de crear uno!"
          />
          
          <div
            className="relative w-full h-64 bg-cover bg-center rounded-xl overflow-hidden mt-12"
            style={{
              backgroundImage: `url('https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/vinculo%2Fvinculo.jpg?alt=media&token=5da1749d-2b9d-4644-bb16-79125d8e2654')`,
            }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-center p-4">
              <h2 className="text-3xl font-bold text-white mb-4">No solo planifiques, conecta</h2>
              <h3 className="text-3xl font-bold text-white mb-4">Accede a Herramientas y reflexiones</h3>
              <Link href="/vinculo" passHref>
                <Button variant="secondary" size="lg">Descubre más</Button>
              </Link>
            </div>
          </div>

          <HorizontalCardCarousel
            title="Recuerdos Memorables de Salidas Pasadas"
            items={pastOutings}
            isLoading={loading}
            emptyMessage="Aquí aparecerán tus aventuras una vez completadas."
          />
        </div>
      )}
    </div>
  );
}