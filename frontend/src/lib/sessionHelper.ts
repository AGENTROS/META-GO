import { cookies } from 'next/headers';
import { verifyJWTTokenServer } from './tokenVerifier';

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('metago_session')?.value;
  if (!token) return null;
  return verifyJWTTokenServer(token);
}
