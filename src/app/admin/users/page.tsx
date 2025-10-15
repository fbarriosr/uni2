
import { getUsers } from '@/lib/data';
import AuthCheck from '@/components/AuthCheck';
import UsersClientPage from '@/components/admin/UsersClientPage';

// This will be an admin-only route, checked via AuthCheck and menu visibility
export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <AuthCheck>
        <UsersClientPage initialUsers={users} />
    </AuthCheck>
  );
}
