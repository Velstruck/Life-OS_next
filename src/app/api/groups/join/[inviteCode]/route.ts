import { NextRequest, NextResponse } from 'next/server';
import Group from '@/lib/models/Group';
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

    const group = await Group.findOne({ inviteCode });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    if (!group.members.some((id: any) => id.toString() === userPayload.userId)) {
      group.members.push(userPayload.userId as any);
      await group.save();
    }

    await group.populate('createdBy members expenses');

    return NextResponse.json({ group: { id: group._id, name: group.name, inviteCode: group.inviteCode, createdBy: transformUser(group.createdBy), members: Array.isArray(group.members) ? group.members.map(transformUser) : [], expenses: Array.isArray(group.expenses) ? group.expenses.map((exp: any) => exp._id) : [] } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 });
  }
}
