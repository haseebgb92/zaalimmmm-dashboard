import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Check if there's data in the POS tables
    const productsCount = await db.execute('SELECT COUNT(*) as count FROM pos_products');
    const ridersCount = await db.execute('SELECT COUNT(*) as count FROM pos_riders');
    const customersCount = await db.execute('SELECT COUNT(*) as count FROM pos_customers');
    const ordersCount = await db.execute('SELECT COUNT(*) as count FROM pos_orders');
    
    // Get sample products
    const sampleProducts = await db.execute('SELECT * FROM pos_products LIMIT 5');
    
    return NextResponse.json({
      success: true,
      counts: {
        products: productsCount[0]?.count || 0,
        riders: ridersCount[0]?.count || 0,
        customers: customersCount[0]?.count || 0,
        orders: ordersCount[0]?.count || 0,
      },
      sampleProducts: sampleProducts.slice(0, 3)
    });
  } catch (error) {
    console.error('Data check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
