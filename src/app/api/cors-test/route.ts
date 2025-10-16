import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';

export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  const response = NextResponse.json({
    message: 'CORS test successful',
    timestamp: new Date().toISOString(),
    origin: request.headers.get('origin'),
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
  });
  
  return addCorsHeaders(response);
}

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  const body = await request.json();
  
  const response = NextResponse.json({
    message: 'CORS POST test successful',
    timestamp: new Date().toISOString(),
    receivedData: body,
    origin: request.headers.get('origin'),
  });
  
  return addCorsHeaders(response);
}

export async function OPTIONS(request: NextRequest) {
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
