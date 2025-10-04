import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sales, expenses } from '@/lib/db/schema';
import { z } from 'zod';

const salesImportSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.enum(['spot', 'foodpanda']),
  orders: z.number().int().min(0),
  gross_amount: z.number().positive(),
  notes: z.string().optional(),
});

const expensesImportSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  item: z.string().min(1),
  qty: z.number().positive().optional(),
  unit: z.string().optional(),
  amount: z.number().positive(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    console.log('Import request:', { type, dataLength: data?.length, firstRow: data?.[0] });

    if (!type || !data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const results = {
      success: 0,
      errors: [] as Array<{ row: number; data: unknown; error: unknown }>,
    };

    if (type === 'sales') {
      for (let i = 0; i < data.length; i++) {
        try {
          const validatedData = salesImportSchema.parse(data[i]);
          
          // Use gross_amount directly
          const amount = validatedData.gross_amount;
          
          await db.insert(sales).values({
            date: validatedData.date,
            source: validatedData.source,
            orders: validatedData.orders,
            grossAmount: amount.toString(),
            notes: validatedData.notes,
          });
          
          results.success++;
        } catch (error) {
          results.errors.push({
            row: i + 1,
            data: data[i],
            error: error instanceof z.ZodError ? error.issues : (error as Error).message,
          });
        }
      }
    } else if (type === 'expenses') {
      for (let i = 0; i < data.length; i++) {
        try {
          const validatedData = expensesImportSchema.parse(data[i]);
          
          await db.insert(expenses).values({
            date: validatedData.date,
            item: validatedData.item,
            qty: validatedData.qty?.toString(),
            unit: validatedData.unit,
            amount: validatedData.amount.toString(),
            notes: validatedData.notes,
          });
          
          results.success++;
        } catch (error) {
          results.errors.push({
            row: i + 1,
            data: data[i],
            error: error instanceof z.ZodError ? error.issues : (error as Error).message,
          });
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid type. Must be "sales" or "expenses"' }, { status: 400 });
    }

    return NextResponse.json({
      message: `Import completed. ${results.success} records imported successfully.`,
      results,
    });
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
