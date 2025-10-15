import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType = 'single_order' } = body;
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.vercel.app';
    
    // Generate test data based on type
    let testData;
    let description;
    
    switch (testType) {
      case 'single_order':
        testData = {
          source: 'spot',
          orders: 1,
          grossAmount: 250.00,
          timestamp: dayjs().tz('Asia/Karachi').format(),
          notes: 'Test order from POS integration',
        };
        description = 'Single order test';
        break;
        
      case 'multiple_orders':
        testData = {
          source: 'foodpanda',
          orders: 3,
          grossAmount: 750.00,
          timestamp: dayjs().tz('Asia/Karachi').format(),
          notes: 'Multiple orders test',
        };
        description = 'Multiple orders test';
        break;
        
      case 'late_night_order':
        // Simulate order at 1 AM (should belong to previous business day)
        testData = {
          source: 'spot',
          orders: 1,
          grossAmount: 180.00,
          timestamp: dayjs().tz('Asia/Karachi').hour(1).minute(30).format(),
          notes: 'Late night order test (1:30 AM)',
        };
        description = 'Late night order test (1:30 AM)';
        break;
        
      case 'early_morning_order':
        // Simulate order at 8 AM (should belong to previous business day)
        testData = {
          source: 'spot',
          orders: 1,
          grossAmount: 120.00,
          timestamp: dayjs().tz('Asia/Karachi').hour(8).minute(0).format(),
          notes: 'Early morning order test (8:00 AM)',
        };
        description = 'Early morning order test (8:00 AM)';
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid test type',
          availableTypes: ['single_order', 'multiple_orders', 'late_night_order', 'early_morning_order'],
        }, { status: 400 });
    }
    
    // Send test data to the sales API
    const response = await fetch(`${baseUrl}/api/pos/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      testType,
      description,
      testData,
      apiResponse: result,
      businessDate: getBusinessDate(testData.timestamp),
      currentTime: dayjs().tz('Asia/Karachi').format('YYYY-MM-DD HH:mm:ss'),
    });
    
  } catch (error) {
    console.error('POS Test Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

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

export async function GET() {
  return NextResponse.json({
    message: 'POS Test Endpoint',
    usage: 'Send POST request with testType parameter',
    availableTestTypes: [
      {
        type: 'single_order',
        description: 'Test single order creation',
      },
      {
        type: 'multiple_orders',
        description: 'Test multiple orders in one request',
      },
      {
        type: 'late_night_order',
        description: 'Test order at 1:30 AM (previous business day)',
      },
      {
        type: 'early_morning_order',
        description: 'Test order at 8:00 AM (previous business day)',
      },
    ],
    businessHours: '2:00 PM - 2:00 AM (Pakistan Time)',
    timezone: 'Asia/Karachi',
  });
}
