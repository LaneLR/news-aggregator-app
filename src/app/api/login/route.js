// src/app/api/login/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // Import jsonwebtoken
import initializeDbAndModels from '@/lib/db';

export async function POST(req) {
  let db;
  try {
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

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // --- JWT GENERATION ---
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not defined in environment variables!");
        return NextResponse.json(
            { error: 'Server configuration error: JWT secret missing' },
            { status: 500 }
        );
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, tier: user.tier }, // Payload
      process.env.JWT_SECRET, // Secret key
      { expiresIn: '1h' } // Token expiration
    );
    // --- END JWT GENERATION ---

    const { password: _, ...userWithoutPassword } = user.toJSON();

    // Create a response object
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: userWithoutPassword,
        // Do NOT send the token in the JSON body if it's in an httpOnly cookie
        // token: token, // <-- Remove this line
      },
      { status: 200 }
    );

    // --- Set JWT as HTTP-ONLY cookie ---
    response.cookies.set('jwt_token', token, {
      httpOnly: true, // IMPORTANT: Makes cookie inaccessible to client-side JavaScript
      secure: process.env.NODE_ENV === 'production', // Use secure in production (HTTPS)
      sameSite: 'strict', // Protects against CSRF
      maxAge: 60 * 60 * 1, // 1 hour (matches token expiration)
      path: '/', // Accessible across the whole site
    });
    // --- END Set JWT as HTTP-ONLY cookie ---

    return response; // Return the response with the cookie

  } catch (err) {
    console.error('Error in /api/login POST request:', err);

    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors ? err.errors.map(e => e.message) : ['Validation error'];
      return NextResponse.json(
        { error: 'Login validation failed', details: errors },
        { status: 400 }
      );
    } else if (err.message && (err.message.includes("Database URL is missing.") || err.message.includes("Unable to connect to the database or initialize Sequelize:"))) {
        return NextResponse.json(
            { error: 'Database connection or initialization failed.', details: err.message },
            { status: 500 }
        );
    }
    else {
      return NextResponse.json(
        { error: 'Internal server error during login', details: err.message },
        { status: 500 }
      );
    }
  }
}
