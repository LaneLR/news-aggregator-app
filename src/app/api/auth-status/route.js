import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req) {
  const token = await getToken({ req, secret });

  if (!token) {
    return NextResponse.json({ isLoggedIn: false }, { status: 401 });
  }

  return NextResponse.json(
    {
      isLoggedIn: true,
      user: {
        id: token.id,
        email: token.email,
        tier: token.tier,
        pendingDeletion: token.pendingDeletion,
        emailIsVerified: token.emailIsVerified,
      },
    },
    { status: 200 }
  );
}
