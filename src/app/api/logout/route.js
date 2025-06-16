import { NextResponse } from 'next/server';

export async function POST(request) {
  const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });

  response.cookies.set('jwt_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'strict', 
    maxAge: 0, 
    path: '/', 
  });

  return response;
}