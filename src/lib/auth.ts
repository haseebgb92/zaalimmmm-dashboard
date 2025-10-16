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
  const user = users.find(u => u.username === username);
  if (!user || passwords[username] !== password) {
    return null;
  }
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
