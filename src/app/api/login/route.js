import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import User from '@/lib/models/User';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const { password: _, ...userWithoutPassword } = user.toJSON();

    return NextResponse.json(
      {
        message: 'Login successful',
        user: userWithoutPassword,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
