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
  category: z.string().min(1),
  item: z.string().optional(),
  vendor: z.string().optional(),
  qty: z.number().positive().optional(),
  unit: z.string().optional(),
  unit_price: z.number().positive().optional(),
  amount: z.number().positive().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  return data.amount || (data.qty && data.unit_price);
}, {
  message: "Either amount must be provided, or both qty and unit_price must be provided",
  path: ["amount"]
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

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
          
          // Auto-compute amount if qty and unitPrice are provided
          let amount = validatedData.amount;
          if (validatedData.qty && validatedData.unit_price) {
            amount = validatedData.qty * validatedData.unit_price;
          }
          
          if (!amount) {
            throw new Error('Amount is required');
          }
          
          await db.insert(expenses).values({
            date: validatedData.date,
            category: validatedData.category,
            item: validatedData.item,
            qty: validatedData.qty?.toString(),
            unit: validatedData.unit,
            unitPrice: validatedData.unit_price?.toString(),
            amount: amount.toString(),
            vendor: validatedData.vendor,
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
