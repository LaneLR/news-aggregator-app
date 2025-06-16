// src/lib/auth.js
import jwt from 'jsonwebtoken';
// Removed 'cookies' import as it's not used here anymore
// import { cookies } from 'next/headers';

/**
 * Verifies the JWT token string.
 *
 * @param {string | undefined | null} token The JWT token string.
 * @returns {Promise<{status: string, user: object|null, message: string|null, token: string|null}>}
 * An object indicating authentication status, user payload (if authenticated), and message.
 */
export async function verifyAuthToken(token) { // <-- NOW ACCEPTS THE TOKEN STRING
  try {
    if (!token) {
      return { status: 'unauthenticated', message: 'No token found', user: null, token: null };
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined for token verification!");
      throw new Error('Server configuration error: JWT secret missing');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return { status: 'authenticated', user: decoded, message: 'Authenticated', token };

  } catch (error) {
    console.error("Token verification failed:", error.message);
    if (error.name === 'TokenExpiredError') {
      return { status: 'expired', message: 'Token expired', user: null, token: null };
    }
    return { status: 'invalid', message: 'Invalid token', user: null, token: null };
  }
}
