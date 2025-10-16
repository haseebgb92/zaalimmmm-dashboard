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

// POS Sales Data Schema
const posSalesSchema = z.object({
  source: z.enum(['spot', 'foodpanda']),
  orders: z.number().min(0),
  grossAmount: z.number().min(0),
  timestamp: z.string().optional(), // ISO timestamp from POS
  notes: z.string().optional(),
  posId: z.string().optional(), // POS system identifier
});

// Business day logic: 2 PM to 2 AM Pakistan time
function getBusinessDate(timestamp?: string): string {
  const now = timestamp ? dayjs(timestamp) : dayjs();
  const pakistanTime = now.tz('Asia/Karachi');
  
  // If it's between 2 AM and 2 PM, it belongs to the previous business day
  // If it's between 2 PM and 2 AM (next day), it belongs to the current business day
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
    const body = await request.json();
    const validatedData = posSalesSchema.parse(body);
    
    // Determine business date based on timestamp
    const businessDate = getBusinessDate(validatedData.timestamp);
    
    // Check if sales record already exists for this business day and source
    const existingSales = await db
      .select()
      .from(sales)
      .where(
        and(
          eq(sales.date, businessDate),
          eq(sales.source, validatedData.source)
        )
      )
      .limit(1);
    
    if (existingSales.length > 0) {
      // Update existing record
      const updatedSales = await db
        .update(sales)
        .set({
          orders: existingSales[0].orders + validatedData.orders,
          grossAmount: (parseFloat(existingSales[0].grossAmount) + validatedData.grossAmount).toString(),
          notes: validatedData.notes || existingSales[0].notes,
        })
        .where(eq(sales.id, existingSales[0].id))
        .returning();
      
      const response = NextResponse.json({
        success: true,
        action: 'updated',
        data: updatedSales[0],
        businessDate,
        message: `Updated sales for ${validatedData.source} on ${businessDate}`,
      });
      return addCorsHeaders(response);
    } else {
      // Create new record
      const newSales = await db
        .insert(sales)
        .values({
          date: businessDate,
          source: validatedData.source,
          orders: validatedData.orders,
          grossAmount: validatedData.grossAmount.toString(),
          notes: validatedData.notes,
        })
        .returning();
      
      const response = NextResponse.json({
        success: true,
        action: 'created',
        data: newSales[0],
        businessDate,
        message: `Created new sales record for ${validatedData.source} on ${businessDate}`,
      });
      return addCorsHeaders(response);
    }
  } catch (error) {
    console.error('POS Sales API Error:', error);
    
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
      message: 'Failed to process POS sales data',
    }, { status: 500 });
    return addCorsHeaders(response);
  }
}

// GET endpoint to retrieve current business day sales
export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    const businessDate = date || getBusinessDate();
    
    const salesData = await db
      .select()
      .from(sales)
      .where(eq(sales.date, businessDate))
      .orderBy(sales.source);
    
    const response = NextResponse.json({
      success: true,
      businessDate,
      data: salesData,
    });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('POS Sales GET Error:', error);
    const response = NextResponse.json({
      success: false,
      error: 'Failed to retrieve sales data',
    }, { status: 500 });
    return addCorsHeaders(response);
  }
}
