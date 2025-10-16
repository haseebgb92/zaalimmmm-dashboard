import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posRiders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, phoneNumber, isActive } = body;
    const riderId = parseInt(params.id);

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const updatedRider = await db
      .update(posRiders)
      .set({
        name,
        phoneNumber,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(posRiders.id, riderId))
      .returning();

    if (updatedRider.length === 0) {
      return NextResponse.json(
        { error: 'Rider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedRider[0]);
  } catch (error) {
    console.error('Error updating rider:', error);
    return NextResponse.json(
      { error: 'Failed to update rider' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const riderId = parseInt(params.id);

    const deletedRider = await db
      .delete(posRiders)
      .where(eq(posRiders.id, riderId))
      .returning();

    if (deletedRider.length === 0) {
      return NextResponse.json(
        { error: 'Rider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Rider deleted successfully' });
  } catch (error) {
    console.error('Error deleting rider:', error);
    return NextResponse.json(
      { error: 'Failed to delete rider' },
      { status: 500 }
    );
  }
}
