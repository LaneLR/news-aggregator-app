import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth'; 
export async function GET(request) {
  const authResult = await verifyAuthToken(request);

  if (authResult.status !== 'authenticated') {
    const response = NextResponse.json({ message: authResult.message }, { status: 401 });

    if (authResult.status === 'expired') {
      response.cookies.set('jwt_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0, // Expire immediately
        path: '/',
      });
    }
    return response;
  }

  const userPayload = authResult.user;

  return NextResponse.json({ message: 'Protected data accessed!', user: userPayload }, { status: 200 });
}
