import { NextRequest, NextResponse } from 'next/server';
import Group from '@/lib/models/Group';
import connectDB from '@/lib/db';
import { authenticateToken } from '@/lib/middleware/auth';
import '@/lib/models/User';
import '@/lib/models/Expense';

const generateInviteCode = (): string => Math.random().toString(36).substring(2, 8).toUpperCase();
const transformUser = (user: any) => user ? { id: user._id, email: user.email, name: user.name, avatar: user.avatar } : null;

export async function POST(req: NextRequest) {
  try {
    const authResponse = authenticateToken(req);
    if (authResponse instanceof NextResponse) return authResponse;
    const userPayload = authResponse;

    await connectDB();
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    let inviteCode = generateInviteCode();
    while (await Group.findOne({ inviteCode })) inviteCode = generateInviteCode();

    const group = new Group({ name, inviteCode, createdBy: userPayload.userId, members: [userPayload.userId], expenses: [] });
    await group.save();
    await group.populate('createdBy members');

    return NextResponse.json({ group: { id: group._id, name: group.name, inviteCode: group.inviteCode, createdBy: transformUser(group.createdBy), members: Array.isArray(group.members) ? group.members.map(transformUser) : [], expenses: [] } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResponse = authenticateToken(req);
    if (authResponse instanceof NextResponse) return authResponse;
    const userPayload = authResponse;
    
    await connectDB();
    const groups = await Group.find({ members: userPayload.userId }).populate('createdBy members expenses');

    return NextResponse.json({ groups: groups.map(group => ({ id: group._id, name: group.name, inviteCode: group.inviteCode, createdBy: transformUser(group.createdBy), members: Array.isArray(group.members) ? group.members.map(transformUser) : [], expenses: Array.isArray(group.expenses) ? group.expenses.map((exp: any) => exp._id) : [] })) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get groups' }, { status: 500 });
  }
}
