import { NextRequest, NextResponse } from 'next/server';
import Group from '@/lib/models/Group';
import Expense from '@/lib/models/Expense';
import connectDB from '@/lib/db';
import { authenticateToken } from '@/lib/middleware/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ groupId: string, expenseId: string  }> }) {
  try {
    const authResponse = authenticateToken(req);
    if (authResponse instanceof NextResponse) return authResponse;
    
    await connectDB();
    const { groupId, expenseId } = await params;

    const expense = await Expense.findById(expenseId);
    if (!expense || expense.groupId.toString() !== groupId) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    await Group.findByIdAndUpdate(groupId, { $pull: { expenses: expenseId } });
    await Expense.findByIdAndDelete(expenseId);

    return NextResponse.json({ message: 'Expense deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
