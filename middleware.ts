// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Simple pass-through middleware with optional IP extraction for future use
export function middleware(req: NextRequest) {
  // Example: extract client IP if needed later
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = (forwarded?.split(',')[0] || req.headers.get('x-real-ip') || '').trim();
  // You can attach data to request via headers if desired
  const res = NextResponse.next();
  if (ip) res.headers.set('x-client-ip', ip);
  return res;
}

// Limit to app paths where you might need it (adjust as needed)
export const config = {
  matcher: ['/api/:path*', '/compare', '/'],
};