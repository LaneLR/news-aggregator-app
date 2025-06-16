import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
// Correct: Import the central database and models initializer
import initializeDbAndModels from '@/lib/db';

export async function POST(req) {
  let db; // Declare db variable here
  try {
    // CRITICAL: Ensure database and models are initialized before proceeding
    // This function will handle connecting to DB and syncing models (if configured)
    db = await initializeDbAndModels();

    // CRITICAL: Get the initialized User model from the db object
    const User = db.User;

    const body = await req.json();
    const { email, password } = body;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find the user by email using the PROPERLY INITIALIZED User model
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use the validatePassword method on the user instance (from your model)
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Omit password from response for security
    const { password: _, ...userWithoutPassword } = user.toJSON();

    // In a real application, you would generate and return a JWT here
    // Example (requires 'jsonwebtoken' installed and JWT_SECRET in .env):
    // const jwt = require('jsonwebtoken');
    // const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return NextResponse.json(
      {
        message: 'Login successful',
        user: userWithoutPassword,
        // token: token // If you implement JWT
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in /api/login POST request:', err);

    // Handle specific Sequelize errors or general errors for better client feedback
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
