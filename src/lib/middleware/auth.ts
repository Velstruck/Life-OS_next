import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, TokenPayload } from '../utils/jwt';

export interface AuthenticatedUser extends TokenPayload {}

export const authenticateToken = (req: NextRequest): AuthenticatedUser | NextResponse => {
  // Try to get token from Authorization header first, then fallback to cookie
  const authHeader = req.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;
    
  if (!token) {
    const cookieToken = req.cookies.get('token');
    if (cookieToken) {
      token = cookieToken.value;
    }
  }

  if (!token) {
    return NextResponse.json({ error: 'No authentication token' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  return payload;
};
