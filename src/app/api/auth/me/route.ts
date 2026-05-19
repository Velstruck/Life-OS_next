import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/models/User';
import connectDB from '@/lib/db';
import { authenticateToken } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  try {
    const authResponse = authenticateToken(req);
    if (authResponse instanceof NextResponse) return authResponse;
    const userPayload = authResponse;

    await connectDB();
    const user = await User.findById(userPayload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}
