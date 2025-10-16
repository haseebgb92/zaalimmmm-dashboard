import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sales } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { handleCors, addCorsHeaders } from '@/lib/cors';

dayjs.extend(utc);
dayjs.extend(timezone);

// Webhook payload schema
const webhookSchema = z.object({
  eventType: z.enum(['order_created', 'order_updated', 'order_cancelled', 'daily_summary']),
  timestamp: z.string().optional(),
  data: z.object({
    source: z.enum(['spot', 'foodpanda']),
    orders: z.number().min(0),
    grossAmount: z.number().min(0),
    orderId: z.string().optional(),
    orderType: z.string().optional(),
    paymentMethod: z.string().optional(),
    items: z.array(z.object({
      productId: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      subTotal: z.number()
    })).optional(),
    customerInfo: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
    }).optional(),
  }),
  posId: z.string().optional(),
  signature: z.string().optional(), // For webhook verification
});

// Business day logic: 2 PM to 2 AM Pakistan time
function getBusinessDate(timestamp: string): string {
  const pakistanTime = dayjs(timestamp).tz('Asia/Karachi');
  const hour = pakistanTime.hour();
  
  if (hour >= 2 && hour < 14) {
    // Between 2 AM and 2 PM - belongs to previous business day
    return pakistanTime.subtract(1, 'day').format('YYYY-MM-DD');
  } else {
    // Between 2 PM and 2 AM (next day) - belongs to current business day
    return pakistanTime.format('YYYY-MM-DD');
  }
}

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    console.log('🔔 Webhook received:', {
      method: request.method,
      url: request.url,
      origin: request.headers.get('origin'),
      userAgent: request.headers.get('user-agent'),
      contentType: request.headers.get('content-type')
    });
    
    const body = await request.json();
    console.log('📥 Webhook payload:', JSON.stringify(body, null, 2));
    
    const validatedData = webhookSchema.parse(body);
    console.log('✅ Webhook validation successful:', validatedData);
    
    const businessDate = getBusinessDate(validatedData.timestamp || new Date().toISOString());
    
    // Handle different webhook events
    switch (validatedData.eventType) {
      case 'order_created':
      case 'order_updated':
        await handleOrderEvent(businessDate, validatedData.data, 'add');
        break;
        
      case 'order_cancelled':
        await handleOrderEvent(businessDate, validatedData.data, 'subtract');
        break;
        
      case 'daily_summary':
        await handleDailySummary(businessDate, validatedData.data);
        break;
    }
    
    const response = NextResponse.json({
      success: true,
      event: validatedData.eventType,
      businessDate,
      message: `Processed ${validatedData.eventType} for ${validatedData.data.source}`,
    });
    
    console.log('📤 Webhook response:', {
      success: true,
      event: validatedData.eventType,
      businessDate,
      message: `Processed ${validatedData.eventType} for ${validatedData.data.source}`,
    });
    
    return addCorsHeaders(response);
    
  } catch (error) {
    console.error('POS Webhook Error:', error);
    
    if (error instanceof z.ZodError) {
      const response = NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.issues,
      }, { status: 400 });
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
    return addCorsHeaders(response);
  }
}

async function handleOrderEvent(businessDate: string, data: { source: 'spot' | 'foodpanda'; orders: number; grossAmount: number }, operation: 'add' | 'subtract') {
  const existingSales = await db
    .select()
    .from(sales)
    .where(
      and(
        eq(sales.date, businessDate),
        eq(sales.source, data.source)
      )
    )
    .limit(1);
  
  if (existingSales.length > 0) {
    // Update existing record
    const currentOrders = existingSales[0].orders;
    const currentAmount = parseFloat(existingSales[0].grossAmount);
    
    const newOrders = operation === 'add' 
      ? currentOrders + data.orders 
      : Math.max(0, currentOrders - data.orders);
    
    const newAmount = operation === 'add'
      ? currentAmount + data.grossAmount
      : Math.max(0, currentAmount - data.grossAmount);
    
    await db
      .update(sales)
      .set({
        orders: newOrders,
        grossAmount: newAmount.toString(),
      })
      .where(eq(sales.id, existingSales[0].id));
  } else if (operation === 'add') {
    // Create new record only for additions
    await db
      .insert(sales)
      .values({
        date: businessDate,
        source: data.source,
        orders: data.orders,
        grossAmount: data.grossAmount.toString(),
        notes: `Auto-generated from POS webhook`,
      });
  }
}

async function handleDailySummary(businessDate: string, data: { source: 'spot' | 'foodpanda'; orders: number; grossAmount: number }) {
  // Replace existing record with daily summary
  await db
    .delete(sales)
    .where(
      and(
        eq(sales.date, businessDate),
        eq(sales.source, data.source)
      )
    );
  
  await db
    .insert(sales)
    .values({
      date: businessDate,
      source: data.source,
      orders: data.orders,
      grossAmount: data.grossAmount.toString(),
      notes: `Daily summary from POS`,
    });
}
