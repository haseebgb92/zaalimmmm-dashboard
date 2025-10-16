import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Check if all required tables exist
    const tables = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('pos_orders', 'pos_order_items', 'pos_products')
      ORDER BY table_name
    `);
    
    // Check table structures
    const ordersColumns = await db.execute(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'pos_orders' 
      ORDER BY ordinal_position
    `);
    
    const orderItemsColumns = await db.execute(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'pos_order_items' 
      ORDER BY ordinal_position
    `);
    
    // Check if we have any products
    const products = await db.execute('SELECT COUNT(*) as count FROM pos_products');
    
    // Try a simple insert test
    let insertTest = null;
    try {
      const testResult = await db.execute(`
        INSERT INTO pos_orders (
          "orderNumber", "totalAmount", "discountAmount", "finalAmount", 
          "orderType", "paymentMethod", status, "createdAt", "updatedAt"
        ) VALUES (
          'TEST-${Date.now()}', '100', '0', '100', 
          'test', 'cash', 'completed', NOW(), NOW()
        ) RETURNING id
      `);
      insertTest = { success: true, orderId: testResult[0].id };
      
      // Clean up test record
      await db.execute(`DELETE FROM pos_orders WHERE id = ${testResult[0].id}`);
    } catch (error) {
      insertTest = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    return NextResponse.json({
      success: true,
      tables: tables.map(t => t.table_name),
      ordersColumns: ordersColumns,
      orderItemsColumns: orderItemsColumns,
      productsCount: products[0]?.count || 0,
      insertTest
    });
  } catch (error) {
    console.error('Migration check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
