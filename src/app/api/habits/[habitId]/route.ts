import { NextRequest, NextResponse } from 'next/server';
import Habit from '@/lib/models/Habit';
import connectDB from '@/lib/db';
import { authenticateToken } from '@/lib/middleware/auth';

const transformUser = (user: any) => user ? { id: user._id, email: user.email, name: user.name, avatar: user.avatar } : null;

export async function GET(req: NextRequest, { params }: { params: Promise<{ habitId: string  }> }) {
  try {
    const authResponse = authenticateToken(req);
    if (authResponse instanceof NextResponse) return authResponse;
    
    await connectDB();
    const habitId = (await params).habitId;
    const habit = await Habit.findById(habitId).populate('createdBy participants');

    if (!habit) return NextResponse.json({ error: 'Habit not found' }, { status: 404 });

    return NextResponse.json({ habit: { id: habit._id, title: habit.title, description: habit.description, inviteCode: habit.inviteCode, createdBy: transformUser(habit.createdBy), participants: Array.isArray(habit.participants) ? habit.participants.map(transformUser) : [], logs: habit.logs } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get habit' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ habitId: string  }> }) {
  try {
    const authResponse = authenticateToken(req);
    if (authResponse instanceof NextResponse) return authResponse;
    const userPayload = authResponse;
    
    await connectDB();
    const habitId = (await params).habitId;
    const habit = await Habit.findById(habitId);

    if (!habit) return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    if (habit.createdBy.toString() !== userPayload.userId) return NextResponse.json({ error: 'Only the creator can delete this habit' }, { status: 403 });

    await Habit.findByIdAndDelete(habitId);
    return NextResponse.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 });
  }
}
