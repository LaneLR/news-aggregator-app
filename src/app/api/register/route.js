import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import User from '@/lib/models/User';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    //hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    //create user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      tier: 0, // default tier
    });
    //omit password from response
    const { password: _, ...userWithoutPassword } = newUser.toJSON();

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}