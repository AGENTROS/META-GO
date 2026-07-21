import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyJWTTokenServer } from '@/lib/tokenVerifier';
import { RealtimeProvider } from '@/components/layout/RealtimeProvider';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('metago_session')?.value;

  if (!token) {
    redirect('/auth');
  }

  const payload = await verifyJWTTokenServer(token);
  if (!payload) {
    redirect('/auth');
  }

  return <RealtimeProvider>{children}</RealtimeProvider>;
}
