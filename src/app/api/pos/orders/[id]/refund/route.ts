import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { refundAmount, reason, refundType = 'full' } = body;
    
    if (!refundAmount || refundAmount <= 0) {
      return NextResponse.json({ error: 'Valid refund amount is required' }, { status: 400 });
    }
    
    // Get the original order
    const order = await db.execute(`
      SELECT * FROM pos_orders WHERE id = ${id}
    `);
    
    if (order.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    const originalOrder = order[0];
    
    // Check if refund amount is valid
    if (refundAmount > Number(originalOrder.finalAmount)) {
      return NextResponse.json({ error: 'Refund amount cannot exceed order total' }, { status: 400 });
    }
    
    // Update order status to refunded
    await db.execute(`
      UPDATE pos_orders 
      SET 
        status = 'refunded',
        "updatedAt" = NOW(),
        notes = COALESCE(notes, '') || ' | REFUNDED: ₨${refundAmount} - ${reason || 'No reason provided'}'
      WHERE id = ${id}
    `);
    
    // Create a refund record (you might want to create a separate refunds table)
    // For now, we'll just update the order with refund information
    
    return NextResponse.json({
      success: true,
      message: `Refund of ₨${refundAmount} processed successfully`,
      refundAmount,
      refundType,
      reason
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}
