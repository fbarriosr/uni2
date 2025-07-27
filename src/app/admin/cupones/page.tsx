
import { getCoupons } from '@/lib/data';
import AuthCheck from '@/components/AuthCheck';
import CouponClientPage from '@/components/cupones/CouponClientPage';

export default async function CuponesPage() {
  const coupons = await getCoupons();

  // Sort coupons by creation date, newest first
  const sortedCoupons = coupons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <AuthCheck>
      <div className="container mx-auto py-8">
        <header className="mb-8">
            <h1 className="text-3xl font-headline text-foreground">Gestión de Cupones</h1>
            <p className="text-muted-foreground mt-1">Crea, edita y administra los cupones de descuento.</p>
        </header>
        <CouponClientPage initialCoupons={sortedCoupons} />
      </div>
    </AuthCheck>
  );
}
