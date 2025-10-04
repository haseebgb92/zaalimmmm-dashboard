import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sales } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const salesUpdateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  source: z.enum(['spot', 'foodpanda']).optional(),
  orders: z.number().int().min(0).optional(),
  grossAmount: z.number().positive().optional(),
  notes: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = salesUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = { ...validatedData };
    
    if (validatedData.date) {
      // Convert date to Asia/Karachi timezone
      updateData.date = dayjs.tz(validatedData.date, 'Asia/Karachi').startOf('day').utc().format('YYYY-MM-DD');
    }

    if (validatedData.grossAmount) {
      updateData.grossAmount = validatedData.grossAmount.toString();
    }

    const updatedSale = await db
      .update(sales)
      .set(updateData)
      .where(eq(sales.id, id))
      .returning();

    if (updatedSale.length === 0) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    return NextResponse.json(updatedSale[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error updating sale:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deletedSale = await db
      .delete(sales)
      .where(eq(sales.id, id))
      .returning();

    if (deletedSale.length === 0) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
