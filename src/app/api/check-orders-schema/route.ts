import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Check pos_orders table structure
    const ordersSchema = await db.execute(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'pos_orders' 
      ORDER BY ordinal_position
    `);
    
    // Check pos_order_items table structure
    const orderItemsSchema = await db.execute(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'pos_order_items' 
      ORDER BY ordinal_position
    `);
    
    // Check if tables exist and have data
    const ordersCount = await db.execute('SELECT COUNT(*) as count FROM pos_orders');
    const orderItemsCount = await db.execute('SELECT COUNT(*) as count FROM pos_order_items');
    const productsCount = await db.execute('SELECT COUNT(*) as count FROM pos_products');
    
    return NextResponse.json({
      success: true,
      tables: {
        pos_orders: {
          schema: ordersSchema,
          count: ordersCount[0]?.count || 0
        },
        pos_order_items: {
          schema: orderItemsSchema,
          count: orderItemsCount[0]?.count || 0
        },
        pos_products: {
          count: productsCount[0]?.count || 0
        }
      }
    });
  } catch (error) {
    console.error('Schema check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}