import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { personalExpenses } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

const personalExpensesSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  head: z.string().min(1),
  amount: z.number(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const head = searchParams.get('head');

    let query = db.select().from(personalExpenses);

    const conditions = [];
    if (startDate) conditions.push(gte(personalExpenses.date, startDate));
    if (endDate) conditions.push(lte(personalExpenses.date, endDate));
    if (head) conditions.push(eq(personalExpenses.head, head));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const data = await query.orderBy(personalExpenses.date, personalExpenses.createdAt);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching personal expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personal expenses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = personalExpensesSchema.parse(body);

    const newExpense = await db.insert(personalExpenses).values({
      date: validatedData.date,
      head: validatedData.head,
      amount: validatedData.amount.toString(),
      notes: validatedData.notes,
    }).returning();

    return NextResponse.json(newExpense[0], { status: 201 });
  } catch (error) {
    console.error('Error creating personal expense:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create personal expense' },
      { status: 500 }
    );
  }
}
