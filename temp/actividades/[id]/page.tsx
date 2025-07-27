
import { getActivityById, getActivityComments } from '@/lib/data';
import AuthCheck from '@/components/AuthCheck';
import ActivityDetailClientPage from '@/components/actividades/ActivityDetailClientPage';
import { notFound } from 'next/navigation';
import type { Comment } from '@/lib/types';

interface ActivityDetailsPageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

// This is now a Server Component
export default async function ActivityDetailsPage({ params, searchParams }: ActivityDetailsPageProps) {
  // 1. Fetch data on the server
  const activity = await getActivityById(params.id);
  const comments = await getActivityComments(params.id);
  const salidaId = typeof searchParams?.salidaId === 'string' ? searchParams.salidaId : undefined;

  // Hide non-published activities from end-users.
  // Admins would need a separate admin view to see non-published activities.
  if (!activity || activity.status !== 'publicada') {
    notFound();
  }

  // 2. Pass data to a Client Component, wrapped in an AuthCheck
  return (
    <AuthCheck>
      <ActivityDetailClientPage activity={activity} comments={comments} salidaId={salidaId} />
    </AuthCheck>
  );
}

// Keep generateStaticParams for build-time optimization
export async function generateStaticParams() {
  const { getActivities } = await import('@/lib/data');
  const activities = await getActivities(); // This now correctly gets only published activities
  return activities.map(activity => ({ id: activity.id }));
}
