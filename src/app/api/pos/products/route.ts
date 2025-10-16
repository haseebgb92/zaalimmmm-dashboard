import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

// Sample products - in production, this would come from a database
const products = [
  { id: '1', name: 'Chicken Shawarma', price: 350, category: 'Shawarma' },
  { id: '2', name: 'Beef Shawarma', price: 400, category: 'Shawarma' },
  { id: '3', name: 'Mixed Shawarma', price: 450, category: 'Shawarma' },
  { id: '4', name: 'Chicken Wrap', price: 300, category: 'Wraps' },
  { id: '5', name: 'Beef Wrap', price: 350, category: 'Wraps' },
  { id: '6', name: 'Fries', price: 150, category: 'Sides' },
  { id: '7', name: 'Cola', price: 80, category: 'Beverages' },
  { id: '8', name: 'Water', price: 50, category: 'Beverages' },
];

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  
  if (!user || (user.role !== 'pos' && user.role !== 'admin')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    products,
  });
}
