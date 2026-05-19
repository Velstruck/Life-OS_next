import { NextRequest, NextResponse } from 'next/server';
import Habit from '@/lib/models/Habit';
import connectDB from '@/lib/db';
import { authenticateToken } from '@/lib/middleware/auth';

const transformUser = (user: any) => user ? { id: user._id, email: user.email, name: user.name, avatar: user.avatar } : null;

export async function POST(req: NextRequest, { params }: { params: Promise<{ inviteCode: string  }> }) {
  try {
    const authResponse = authenticateToken(req);
    if (authResponse instanceof NextResponse) return authResponse;
    const userPayload = authResponse;
    
    await connectDB();
    const inviteCode = (await params).inviteCode;

    const habit = await Habit.findOne({ inviteCode });
    if (!habit) return NextResponse.json({ error: 'Habit not found' }, { status: 404 });

    if (!habit.participants.some((id: any) => id.toString() === userPayload.userId)) {
      habit.participants.push(userPayload.userId as any);
      await habit.save();
    }

    await habit.populate('createdBy participants');

    return NextResponse.json({ habit: { id: habit._id, title: habit.title, description: habit.description, inviteCode: habit.inviteCode, createdBy: transformUser(habit.createdBy), participants: Array.isArray(habit.participants) ? habit.participants.map(transformUser) : [], logs: habit.logs } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to join habit' }, { status: 500 });
  }
}
