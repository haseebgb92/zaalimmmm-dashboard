import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Use raw SQL to fetch products
    const products = await db.execute('SELECT * FROM pos_products WHERE is_active = true ORDER BY category');
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products (simple):', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
