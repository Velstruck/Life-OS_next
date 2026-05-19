import { NextRequest, NextResponse } from 'next/server';
import Habit from '@/lib/models/Habit';
import connectDB from '@/lib/db';
import { authenticateToken } from '@/lib/middleware/auth';

const transformUser = (user: any) => user ? { id: user._id, email: user.email, name: user.name, avatar: user.avatar } : null;

export async function POST(req: NextRequest, { params }: { params: Promise<{ habitId: string  }> }) {
  try {
    const authResponse = authenticateToken(req);
    if (authResponse instanceof NextResponse) return authResponse;
    const userPayload = authResponse;
    
    await connectDB();
    const habitId = (await params).habitId;
    const { date } = await req.json();

    if (!date) return NextResponse.json({ error: 'Date is required' }, { status: 400 });

    const habit = await Habit.findById(habitId);
    if (!habit) return NextResponse.json({ error: 'Habit not found' }, { status: 404 });

    let log = habit.logs.find((l: any) => l.date === date);
    if (!log) {
      log = { date, completedBy: [] };
      habit.logs.push(log);
      log.completedBy.push(userPayload.userId as any);
    } else {
      const userIndex = log.completedBy.findIndex((id: any) => id.toString() === userPayload.userId);
      if (userIndex !== -1) {
        log.completedBy.splice(userIndex, 1);
        if (log.completedBy.length === 0) {
          const logIndex = habit.logs.findIndex((l: any) => l.date === date);
          if (logIndex !== -1) habit.logs.splice(logIndex, 1);
        }
      } else {
        log.completedBy.push(userPayload.userId as any);
      }
    }

    await habit.save();
    await habit.populate('createdBy participants');

    return NextResponse.json({ habit: { id: habit._id, title: habit.title, description: habit.description, inviteCode: habit.inviteCode, createdBy: transformUser(habit.createdBy), participants: Array.isArray(habit.participants) ? habit.participants.map(transformUser) : [], logs: habit.logs } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add log' }, { status: 500 });
  }
}
