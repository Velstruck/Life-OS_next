import { NextRequest, NextResponse } from 'next/server';
import Group from '@/lib/models/Group';
import connectDB from '@/lib/db';
import { authenticateToken } from '@/lib/middleware/auth';
import { calculateSettlements } from '@/lib/utils/calculateSettlements';

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string  }> }) {
  try {
    const authResponse = authenticateToken(req);
    if (authResponse instanceof NextResponse) return authResponse;
    
    await connectDB();
    const groupId = (await params).groupId;
    const group = await Group.findById(groupId).populate({ path: 'expenses', populate: { path: 'paidBy splits.userId' } });

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const memberIds = group.members.map((member: any) => typeof member === 'string' ? member : member._id);
    const expensesData = group.expenses.map((exp: any) => ({ paidBy: exp.paidBy._id || exp.paidBy, amount: exp.amount, splits: exp.splits.map((split: any) => ({ userId: split.userId._id || split.userId, amount: split.amount })) }));

    const settlements = calculateSettlements(memberIds, expensesData);

    return NextResponse.json({ settlements: settlements.map(s => ({ from: s.from, to: s.to, amount: s.amount })) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to calculate settlements' }, { status: 500 });
  }
}
