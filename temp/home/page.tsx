
import { getActivities } from '@/lib/data';
import AuthCheck from '@/components/AuthCheck';
import HomeClientPage from '@/components/home/HomeClientPage';

// This is now a Server Component
export default async function HomePage() {
  // 1. Fetch data on the server
  const activities = await getActivities();

  // 2. Pass data to a Client Component, wrapped in an AuthCheck
  return (
    <AuthCheck>
      <HomeClientPage initialActivities={activities} />
    </AuthCheck>
  );
}
