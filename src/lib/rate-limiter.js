// src/lib/rate-limiter.js
// --- NO EXTERNAL RATE LIMITING PACKAGE NEEDED ---
// This implements a simple in-memory IP-based rate limiter for Next.js App Router.

// Stores request counts for each IP address.
// Key: IP address (string)
// Value: Map<timestamp, count> - A map of timestamps to request counts within that timestamp.
const requestCounts = new Map();

// Configuration for your authentication rate limiter
const RATE_LIMIT_INTERVAL_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_INTERVAL = 5; // Allow 5 requests per minute from a single IP
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Run cleanup every 5 minutes

// Function to get the client's IP address from the request
const getClientIp = (req) => {
  // Check common headers for IP address, useful when behind proxies (like Vercel)
  return req.headers['x-forwarded-for']?.split(',').shift() ||
         req.socket?.remoteAddress || // For direct connections
         'unknown_ip'; // Fallback for local development if IP is truly undefined
};

// --- Cleanup function for expired entries ---
// This prevents the 'requestCounts' Map from growing indefinitely.
function cleanupExpiredRequests() {
  const now = Date.now();
  for (const [ip, ipTimestamps] of requestCounts.entries()) {
    for (const timestamp of ipTimestamps.keys()) {
      if (now - timestamp > RATE_LIMIT_INTERVAL_MS) {
        ipTimestamps.delete(timestamp); // Remove old timestamps
      }
    }
    if (ipTimestamps.size === 0) {
      requestCounts.delete(ip); // Remove IP if no active requests
    }
  }
  // console.log("Rate limiter cleanup performed. Current IPs tracked:", requestCounts.size); // Optional diagnostic
}

// Start the cleanup process (run periodically in the background)
// This will run once when the module loads on the server.
setInterval(cleanupExpiredRequests, CLEANUP_INTERVAL_MS);


/**
 * Middleware function for rate limiting Next.js App Router API routes.
 *
 * @param {Request} req The Next.js Request object.
 * @param {Response} res The Next.js NextResponse object (used for type hint).
 * @throws {Error} Throws an error with status 429 if the rate limit is exceeded.
 */
export const authRateLimitMiddleware = async (req, NextResponse) => {
  const ip = getClientIp(req);
  const now = Date.now();

  // Get or initialize the map for this IP
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, new Map());
  }
  const ipTimestamps = requestCounts.get(ip);

  // Add the current request timestamp
  if (!ipTimestamps.has(now)) {
    ipTimestamps.set(now, 0);
  }
  ipTimestamps.set(now, ipTimestamps.get(now) + 1);

  // Calculate total requests in the current interval
  let totalRequests = 0;
  for (const [timestamp, count] of ipTimestamps.entries()) {
    if (now - timestamp < RATE_LIMIT_INTERVAL_MS) {
      totalRequests += count;
    }
  }

  // console.log(`IP: ${ip}, Requests in interval: ${totalRequests}`); // Optional diagnostic

  if (totalRequests > MAX_REQUESTS_PER_INTERVAL) {
    // Manually set a 'status' property on the error to be caught by the route handler
    const error = new Error('Too many requests. Please try again after some time.');
    error.status = 429;
    throw error;
  }
};
