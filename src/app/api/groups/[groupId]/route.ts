import { NextRequest, NextResponse } from 'next/server';
import Group from '@/lib/models/Group';
import Expense from '@/lib/models/Expense';
import connectDB from '@/lib/db';
import { authenticateToken } from '@/lib/middleware/auth';

const transformUser = (user: any) => user ? { id: user._id, email: user.email, name: user.name, avatar: user.avatar } : null;
const transformExpense = (expense: any) => ({ id: expense._id, groupId: expense.groupId, description: expense.description, amount: expense.amount, paidBy: transformUser(expense.paidBy), splits: expense.splits.map((split: any) => ({ userId: split.userId?._id || split.userId, amount: split.amount })), date: expense.date });

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string  }> }) {
  try {
    const authResponse = authenticateToken(req);
    if (authResponse instanceof NextResponse) return authResponse;
    
    await connectDB();
    const groupId = (await params).groupId;
    const group = await Group.findById(groupId).populate('createdBy members').populate({ path: 'expenses', populate: { path: 'paidBy splits.userId' } });

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    return NextResponse.json({ group: { id: group._id, name: group.name, inviteCode: group.inviteCode, createdBy: transformUser(group.createdBy), members: Array.isArray(group.members) ? group.members.map(transformUser) : [], expenses: Array.isArray(group.expenses) ? group.expenses.map(transformExpense) : [] } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get group' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ groupId: string  }> }) {
  try {
    const authResponse = authenticateToken(req);
    if (authResponse instanceof NextResponse) return authResponse;
    const userPayload = authResponse;
    
    await connectDB();
    const groupId = (await params).groupId;
    const group = await Group.findById(groupId);

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    if (group.createdBy.toString() !== userPayload.userId) return NextResponse.json({ error: 'Only the creator can delete this group' }, { status: 403 });

    await Expense.deleteMany({ groupId });
    await Group.findByIdAndDelete(groupId);

    return NextResponse.json({ message: 'Group deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
