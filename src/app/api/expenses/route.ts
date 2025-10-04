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
  category: z.string().min(1),
  item: z.string().optional(),
  qty: z.number().positive().optional(),
  unit: z.string().optional(),
  unitPrice: z.number().positive().optional(),
  amount: z.number().positive().optional(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // Either amount is provided, or both qty and unitPrice are provided
  return data.amount || (data.qty && data.unitPrice);
}, {
  message: "Either amount must be provided, or both qty and unitPrice must be provided",
  path: ["amount"]
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const category = searchParams.get('category');

    const conditions = [];
    
    if (startDate && endDate) {
      const start = dayjs.tz(startDate, 'Asia/Karachi').startOf('day').utc().format('YYYY-MM-DD');
      const end = dayjs.tz(endDate, 'Asia/Karachi').endOf('day').utc().format('YYYY-MM-DD');
      conditions.push(and(gte(expenses.date, start), lte(expenses.date, end)));
    }

    if (category) {
      conditions.push(eq(expenses.category, category));
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

    // Convert date to Asia/Karachi timezone
    const date = dayjs.tz(validatedData.date, 'Asia/Karachi').startOf('day').utc().format('YYYY-MM-DD');

    // Auto-compute amount if qty and unitPrice are provided
    let amount = validatedData.amount;
    if (validatedData.qty && validatedData.unitPrice) {
      amount = validatedData.qty * validatedData.unitPrice;
    }

    // Ensure amount is defined (should be guaranteed by the refine validation)
    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    const newExpense = await db.insert(expenses).values({
      date,
      category: validatedData.category,
      item: validatedData.item,
      qty: validatedData.qty?.toString(),
      unit: validatedData.unit,
      unitPrice: validatedData.unitPrice?.toString(),
      amount: amount.toString(),
      vendor: validatedData.vendor,
      notes: validatedData.notes,
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
