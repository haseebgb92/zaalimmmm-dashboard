import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { expenses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const expensesUpdateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  item: z.string().min(1).optional(),
  qty: z.number().positive().optional(),
  unit: z.string().optional(),
  amount: z.number().positive().optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().url().optional().or(z.literal('')),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = expensesUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = { ...validatedData };
    
    if (validatedData.date) {
      // Store date as-is since it's already in YYYY-MM-DD format
      updateData.date = validatedData.date;
    }

    if (validatedData.qty) {
      updateData.qty = validatedData.qty.toString();
    }

    if (validatedData.amount) {
      updateData.amount = validatedData.amount.toString();
    }

    const updatedExpense = await db
      .update(expenses)
      .set(updateData)
      .where(eq(expenses.id, id))
      .returning();

    if (updatedExpense.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(updatedExpense[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deletedExpense = await db
      .delete(expenses)
      .where(eq(expenses.id, id))
      .returning();

    if (deletedExpense.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
