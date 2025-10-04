import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sales } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const salesSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.enum(['spot', 'foodpanda']),
  orders: z.number().int().min(0),
  grossAmount: z.number().positive(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const source = searchParams.get('source');

    const conditions = [];
    
    if (startDate && endDate) {
      // Use dates as-is since they're already in YYYY-MM-DD format
      conditions.push(and(gte(sales.date, startDate), lte(sales.date, endDate)));
    }

    if (source && (source === 'spot' || source === 'foodpanda')) {
      conditions.push(eq(sales.source, source));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const salesData = await db
      .select()
      .from(sales)
      .where(whereClause)
      .orderBy(sales.date, sales.createdAt);

    return NextResponse.json(salesData);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = salesSchema.parse(body);

    // Store date as-is since it's already in YYYY-MM-DD format
    const date = validatedData.date;

    const newSale = await db.insert(sales).values({
      date,
      source: validatedData.source,
      orders: validatedData.orders,
      grossAmount: validatedData.grossAmount.toString(),
      notes: validatedData.notes,
    }).returning();

    return NextResponse.json(newSale[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error creating sale:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
