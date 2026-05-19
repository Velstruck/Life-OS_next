import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware/auth';

export async function POST(req: NextRequest) {
  const authResponse = authenticateToken(req);
  if (authResponse instanceof NextResponse) return authResponse;

  const response = NextResponse.json({ message: 'Logged out successfully' });
  
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    expires: new Date(0),
  });

  return response;
}
