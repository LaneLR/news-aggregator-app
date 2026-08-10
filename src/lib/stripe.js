import Stripe from "stripe";

let stripe;

// Lazily constructed, same reasoning as initializeDbAndModels in db.js: a
// module-level `new Stripe(process.env.STRIPE_SECRET_KEY)` throws at import
// time if the key is missing, which breaks Next.js's build-time "collecting
// page data" step for every route that imports it — including in CI, which
// deliberately doesn't set Stripe/DB secrets since neither should be needed
// until a request actually comes in.
export default function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}
