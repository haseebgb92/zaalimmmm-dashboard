import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
// import { eq } from 'drizzle-orm';
import { z } from 'zod';

const settingsUpdateSchema = z.object({
  FP_PROFIT_RATE: z.number().min(0).max(1).optional(),
  CURRENCY: z.string().min(1).optional(),
  categories: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const settingsData = await db.select().from(settings);
    
    const settingsObj = settingsData.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(settingsObj);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = settingsUpdateSchema.parse(body);

    const updates = [];

    if (validatedData.FP_PROFIT_RATE !== undefined) {
      updates.push(
        db.insert(settings)
          .values({ key: 'FP_PROFIT_RATE', value: validatedData.FP_PROFIT_RATE.toString() })
          .onConflictDoUpdate({
            target: settings.key,
            set: { value: validatedData.FP_PROFIT_RATE.toString() }
          })
      );
    }

    if (validatedData.CURRENCY !== undefined) {
      updates.push(
        db.insert(settings)
          .values({ key: 'CURRENCY', value: validatedData.CURRENCY })
          .onConflictDoUpdate({
            target: settings.key,
            set: { value: validatedData.CURRENCY }
          })
      );
    }

    if (validatedData.categories !== undefined) {
      updates.push(
        db.insert(settings)
          .values({ key: 'EXPENSE_CATEGORIES', value: JSON.stringify(validatedData.categories) })
          .onConflictDoUpdate({
            target: settings.key,
            set: { value: JSON.stringify(validatedData.categories) }
          })
      );
    }

    await Promise.all(updates);

    // Return updated settings
    const settingsData = await db.select().from(settings);
    const settingsObj = settingsData.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(settingsObj);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
