import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyJWTTokenServer } from '@/lib/tokenVerifier';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('celestial_jwt')?.value;

  if (!token) {
    redirect('/auth');
  }

  const payload = await verifyJWTTokenServer(token);
  if (!payload || payload.role !== 'admin') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
