import { NextRequest, NextResponse } from 'next/server';
import Group from '@/lib/models/Group';
import Expense from '@/lib/models/Expense';
import connectDB from '@/lib/db';
import { authenticateToken } from '@/lib/middleware/auth';

const transformUser = (user: any) => user ? { id: user._id, email: user.email, name: user.name, avatar: user.avatar } : null;

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string  }> }) {
  try {
    const authResponse = authenticateToken(req);
    if (authResponse instanceof NextResponse) return authResponse;
    const userPayload = authResponse;
    
    await connectDB();
    const groupId = (await params).groupId;
    const { description, amount, splits } = await req.json();

    if (!description || !amount || !splits) return NextResponse.json({ error: 'Description, amount, and splits are required' }, { status: 400 });

    const group = await Group.findById(groupId);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const validatedSplits = splits.map((split: any) => ({ userId: split.userId, amount: split.amount }));
    const expense = new Expense({ groupId, description, amount, paidBy: userPayload.userId, splits: validatedSplits, date: new Date() });

    await expense.save();
    group.expenses.push(expense._id);
    await group.save();
    await expense.populate('paidBy splits.userId');

    return NextResponse.json({ expense: { id: expense._id, groupId: expense.groupId, description: expense.description, amount: expense.amount, paidBy: transformUser(expense.paidBy), splits: expense.splits.map((split: any) => ({ userId: split.userId?._id || split.userId, amount: split.amount })), date: expense.date } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
