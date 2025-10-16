import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posRiders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const riders = await db.select().from(posRiders).where(eq(posRiders.isActive, true));
    return NextResponse.json(riders);
  } catch (error) {
    console.error('Error fetching riders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch riders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phoneNumber, isActive = true } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const newRider = await db.insert(posRiders).values({
      name,
      phoneNumber,
      isActive,
    }).returning();

    return NextResponse.json(newRider[0]);
  } catch (error) {
    console.error('Error creating rider:', error);
    return NextResponse.json(
      { error: 'Failed to create rider' },
      { status: 500 }
    );
  }
}
