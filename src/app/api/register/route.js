// src/app/api/register/route.js
import { NextResponse } from 'next/server';
import initializeDbAndModels from '@/lib/db';
import { authRateLimitMiddleware } from '@/lib/rate-limiter'; // <-- Import the specific middleware

export const dynamic = 'force-dynamic'; // Ensures dynamic execution for rate limiting

export async function POST(req) {
  let db;
  try {
    // --- Apply Rate Limiting: Await the middleware function ---
    await authRateLimitMiddleware(req, NextResponse); // <-- CORRECT USAGE
    // --- End Rate Limiting ---

    db = await initializeDbAndModels();
    const User = db.User;

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const newUser = await User.create({ email, password });

    const { password: _, ...userWithoutPassword } = newUser.toJSON();

    return NextResponse.json(
      {
        message: 'User registered successfully!',
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err && err.status === 429) {
        console.warn("Rate limit exceeded for registration attempt from IP:", req.ip || req.headers['x-forwarded-for']);
        return NextResponse.json(
            { error: 'Too many registration attempts. Please try again later.' },
            { status: 429 }
        );
    }

    console.error('Error in /api/register POST request:', err);

    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = err.errors && err.errors.length > 0 ? err.errors[0].path : 'email';
      return NextResponse.json(
        { error: `User with this ${field} already exists.` },
        { status: 409 }
      );
    } else if (err.name === 'SequelizeValidationError') {
      const errors = err.errors ? err.errors.map(e => e.message) : ['Validation error'];
      return NextResponse.json(
        { error: 'Registration validation failed', details: errors },
        { status: 400 }
      );
    } else if (err.message && (err.message.includes("Database URL is missing.") || err.message.includes("Unable to connect to the database or initialize Sequelize:"))) {
        return NextResponse.json(
            { error: 'Database connection or initialization failed.', details: err.message },
            { status: 500 }
        );
    } else {
      return NextResponse.json(
        { error: 'Internal server error during registration', details: err.message },
        { status: 500 }
      );
    }
  }
}
