import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { expenses } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const expensesSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  item: z.string().min(1),
  qty: z.number().positive().optional(),
  unit: z.string().optional(),
  amount: z.number().positive(),
  notes: z.string().optional(),
  receiptUrl: z.string().url().optional().or(z.literal('')),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const item = searchParams.get('item');

    const conditions = [];
    
    if (startDate && endDate) {
      // Use dates as-is since they're already in YYYY-MM-DD format
      conditions.push(and(gte(expenses.date, startDate), lte(expenses.date, endDate)));
    }

    if (item) {
      conditions.push(eq(expenses.item, item));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const expensesData = await db
      .select()
      .from(expenses)
      .where(whereClause)
      .orderBy(expenses.date, expenses.createdAt);

    return NextResponse.json(expensesData);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = expensesSchema.parse(body);

    // Store date as-is since it's already in YYYY-MM-DD format
    const date = validatedData.date;

    const newExpense = await db.insert(expenses).values({
      date,
      item: validatedData.item,
      qty: validatedData.qty?.toString(),
      unit: validatedData.unit,
      amount: validatedData.amount.toString(),
      notes: validatedData.notes,
      receiptUrl: validatedData.receiptUrl || undefined,
    }).returning();

    return NextResponse.json(newExpense[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
