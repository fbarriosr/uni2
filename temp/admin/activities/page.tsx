
import { getAdminActivities } from '@/lib/data';
import AuthCheck from '@/components/AuthCheck';
import ActivitiesClientPage from '@/components/admin/ActivitiesClientPage';

// This will be an admin-only route, checked via AuthCheck and menu visibility
export default async function AdminActivitiesPage() {
  const activities = await getAdminActivities();

  return (
    <AuthCheck>
        <ActivitiesClientPage initialActivities={activities} />
    </AuthCheck>
  );
}
