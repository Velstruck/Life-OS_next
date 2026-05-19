import { NextRequest, NextResponse } from 'next/server';
import Habit from '@/lib/models/Habit';
import connectDB from '@/lib/db';
import { authenticateToken } from '@/lib/middleware/auth';

const generateInviteCode = (): string => Math.random().toString(36).substring(2, 8).toUpperCase();
const transformUser = (user: any) => user ? { id: user._id, email: user.email, name: user.name, avatar: user.avatar } : null;

export async function POST(req: NextRequest) {
  try {
    const authResponse = authenticateToken(req);
    if (authResponse instanceof NextResponse) return authResponse;
    const userPayload = authResponse;

    await connectDB();
    const { title, description } = await req.json();

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    let inviteCode = generateInviteCode();
    while (await Habit.findOne({ inviteCode })) inviteCode = generateInviteCode();

    const habit = new Habit({ title, description: description || '', inviteCode, createdBy: userPayload.userId, participants: [userPayload.userId], logs: [] });
    await habit.save();
    await habit.populate('createdBy participants');

    return NextResponse.json({ habit: { id: habit._id, title: habit.title, description: habit.description, inviteCode: habit.inviteCode, createdBy: transformUser(habit.createdBy), participants: Array.isArray(habit.participants) ? habit.participants.map(transformUser) : [], logs: habit.logs } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResponse = authenticateToken(req);
    if (authResponse instanceof NextResponse) return authResponse;
    
    await connectDB();
    const habits = await Habit.find({ participants: authResponse.userId }).populate('createdBy participants');

    return NextResponse.json({ habits: habits.map(habit => ({ id: habit._id, title: habit.title, description: habit.description, inviteCode: habit.inviteCode, createdBy: transformUser(habit.createdBy), participants: Array.isArray(habit.participants) ? habit.participants.map(transformUser) : [], logs: habit.logs })) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get habits' }, { status: 500 });
  }
}
