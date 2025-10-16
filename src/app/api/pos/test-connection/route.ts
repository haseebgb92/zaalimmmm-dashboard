import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';

export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  const response = NextResponse.json({
    success: true,
    message: 'POS to Dashboard connection test successful',
    timestamp: new Date().toISOString(),
    origin: request.headers.get('origin'),
    method: request.method,
  });
  
  return addCorsHeaders(response);
}

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const body = await request.json();
    
    const response = NextResponse.json({
      success: true,
      message: 'POS to Dashboard POST test successful',
      receivedData: body,
      timestamp: new Date().toISOString(),
      origin: request.headers.get('origin'),
    });
    
    return addCorsHeaders(response);
  } catch (error) {
    const response = NextResponse.json({
      success: false,
      error: 'Failed to parse request body',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 400 });
    
    return addCorsHeaders(response);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
