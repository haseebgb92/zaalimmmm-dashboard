import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createAuthToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    console.log('Login attempt:', { username, password: password ? '***' : 'empty' });

    if (!username || !password) {
      console.log('Missing username or password');
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const user = authenticateUser(username, password);
    console.log('Authentication result:', user ? 'Success' : 'Failed');
    console.log('User object:', user);

    if (!user) {
      console.log('Invalid credentials for user:', username);
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const token = createAuthToken(user);
    console.log('Generated token:', token);

    const userResponse = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    };
    console.log('User response object:', userResponse);

    return NextResponse.json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
