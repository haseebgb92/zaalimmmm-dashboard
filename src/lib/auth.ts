import { NextRequest } from 'next/server';

export interface User {
  id: string;
  username: string;
  role: 'pos' | 'dashboard' | 'admin';
  name: string;
}

// Simple in-memory user store (in production, use a database)
const users: User[] = [
  {
    id: '1',
    username: 'Hassanmohsin',
    role: 'pos',
    name: 'Hassan Mohsin'
  },
  {
    id: '2', 
    username: 'Haseebgb',
    role: 'dashboard',
    name: 'Haseeb GB'
  },
  {
    id: '3',
    username: 'admin',
    role: 'admin', 
    name: 'Admin User'
  }
];

// Simple password store (in production, use hashed passwords)
const passwords: Record<string, string> = {
  'Hassanmohsin': 'Hassan9420',
  'Haseebgb': 'Ftw852!gb', 
  'admin': 'admin123'
};

export function authenticateUser(username: string, password: string): User | null {
  console.log('Authenticating user:', username);
  console.log('Available users:', users.map(u => u.username));
  console.log('Available passwords:', Object.keys(passwords));
  
  const user = users.find(u => u.username === username);
  console.log('Found user:', user);
  
  if (!user) {
    console.log('User not found');
    return null;
  }
  
  const expectedPassword = passwords[username];
  console.log('Expected password:', expectedPassword ? '***' : 'undefined');
  console.log('Provided password:', password ? '***' : 'empty');
  console.log('Password match:', expectedPassword === password);
  
  if (passwords[username] !== password) {
    console.log('Password mismatch');
    return null;
  }
  
  console.log('Authentication successful');
  return user;
}

export function getUserFromRequest(request: NextRequest): User | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = JSON.parse(atob(token));
    return users.find(u => u.id === decoded.userId) || null;
  } catch {
    return null;
  }
}

export function createAuthToken(user: User): string {
  const payload = { userId: user.id, role: user.role };
  return btoa(JSON.stringify(payload));
}
