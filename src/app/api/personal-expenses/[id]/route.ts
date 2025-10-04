import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { personalExpenses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const personalExpensesUpdateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  head: z.string().min(1).optional(),
  amount: z.number().optional(),
  notes: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = personalExpensesUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = { ...validatedData };
    if (validatedData.amount !== undefined) {
      updateData.amount = validatedData.amount.toString();
    }

    const updatedExpense = await db
      .update(personalExpenses)
      .set(updateData)
      .where(eq(personalExpenses.id, id))
      .returning();

    if (updatedExpense.length === 0) {
      return NextResponse.json(
        { error: 'Personal expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedExpense[0]);
  } catch (error) {
    console.error('Error updating personal expense:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update personal expense' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deletedExpense = await db
      .delete(personalExpenses)
      .where(eq(personalExpenses.id, id))
      .returning();

    if (deletedExpense.length === 0) {
      return NextResponse.json(
        { error: 'Personal expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Personal expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting personal expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete personal expense' },
      { status: 500 }
    );
  }
}
