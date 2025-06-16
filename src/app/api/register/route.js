import { NextResponse } from 'next/server';
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

    const newUser = await User.create({
      email,
      password, 
      tier: 0, // default tier
    });

    const { password: _, ...userWithoutPassword } = newUser.toJSON();

    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (err) {
    
    console.error('Error in /api/register POST request:', err);

    if (err.name === 'SequelizeUniqueConstraintError') {
      return NextResponse.json(
        { error: 'Email address already registered.', type: 'UniqueConstraintError' },
        { status: 409 }
      );

    } else if (err.name === 'SequelizeValidationError') {
      const errors = err.errors ? err.errors.map(e => e.message) : ['Validation error'];
      return NextResponse.json(
        { error: 'Registration validation failed', details: errors, type: 'ValidationError' },
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
        { error: 'Internal server error during registration', details: err.message },
        { status: 500 }
      );
    }
  }
}
