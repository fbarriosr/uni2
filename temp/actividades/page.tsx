
import { getActivities } from '@/lib/data';
import AuthCheck from '@/components/AuthCheck';
import ActivitiesGridClientPage from '@/components/actividades/ActivitiesGridClientPage';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function ActivitiesExplorerLoading() {
    return (
        <div className="container mx-auto py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column Skeleton */}
                <div className="lg:col-span-1 space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <div className="pt-4 space-y-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                </div>
                {/* Right Column Skeleton */}
                <div className="lg:col-span-2">
                    <Skeleton className="h-[calc(100vh-10rem)] w-full" />
                </div>
            </div>
        </div>
    );
}


// This is the new page for browsing all activities
export default async function ActividadesPage() {
  // 1. Fetch data on the server. We get all activities and let the client filter them.
  const activities = await getActivities();

  // 2. Pass data to a Client Component, wrapped in an AuthCheck
  return (
    <AuthCheck>
        <Suspense fallback={<ActivitiesExplorerLoading />}>
            <ActivitiesGridClientPage initialActivities={activities} />
        </Suspense>
    </AuthCheck>
  );
}
