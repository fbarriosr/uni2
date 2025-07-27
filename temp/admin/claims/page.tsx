
import AuthCheck from '@/components/AuthCheck';
import { getClaims } from '@/lib/data';
import ClaimManagementClientPage from '@/components/admin/claims/ClaimManagementClientPage';

export default async function AdminClaimsPage() {
  const claims = await getClaims();
  
  // Sort by creation date, newest first
  const sortedClaims = claims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <AuthCheck>
        <ClaimManagementClientPage initialClaims={sortedClaims} />
    </AuthCheck>
  );
}
