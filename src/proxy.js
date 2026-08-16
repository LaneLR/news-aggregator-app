import { NextResponse } from "next/server";

// Manual, incident-response switch — not automatic health detection. Flip
// MAINTENANCE_MODE=true in Vercel's env vars and redeploy when you notice a
// real problem (a bad deploy that passed the build but breaks at runtime,
// the DB timing out/hitting its connection limit, traffic overwhelming the
// app) — this proxy then serves a static, self-contained maintenance
// response for every request before Next.js ever renders anything.
//
// That "before Next.js ever renders anything" part is the whole point: the
// root layout's own auth() call hits the database on most requests (see
// src/lib/auth.js's jwt callback), so if the *reason* you're in maintenance
// mode is a dead database, a normal page — even a custom one rendered
// through the normal app shell — would just throw right along with
// everything else. Returning a raw Response directly from proxy skips
// layout/auth/React entirely, so this keeps working exactly when it matters
// most. Toggling it off is the same process in reverse: unset the env var,
// redeploy.
const isMaintenanceMode = () => process.env.MAINTENANCE_MODE === "true";

const PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>MochaReads — Down for maintenance</title>
<style>
  :root {
    color-scheme: light;
    --bg: #fdfbf6;
    --text: #1c1917;
    --text-secondary: #57534e;
    --border: #e7ddd0;
    --header-bg: #1a140f;
    --accent: #6f4225;
    --card-bg: #fdfbf6;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      color-scheme: dark;
      --bg: #0e0a07;
      --text: #fafaf9;
      --text-secondary: #a8a29e;
      --border: #2e2419;
      --header-bg: #1a140f;
      --accent: #c9925c;
      --card-bg: #201710;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: Georgia, "Times New Roman", serif;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  header {
    background: var(--header-bg);
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  header img { display: block; }
  header span {
    color: #c9925c;
    font-size: 1.2rem;
    font-weight: 700;
  }
  main {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1.25rem;
  }
  .card {
    max-width: 480px;
    text-align: center;
  }
  .mark {
    display: block;
    margin: 0 auto 1.25rem;
  }
  h1 {
    font-size: 1.8rem;
    margin: 0 0 0.75rem;
  }
  p {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0 0 0.5rem;
  }
  a {
    color: var(--accent);
    font-weight: 600;
  }
</style>
</head>
<body>
  <header>
    <img src="/images/MochaReads-M.png" alt="" width="34" height="31" />
    <span>MochaReads</span>
  </header>
  <main>
    <div class="card">
      <img class="mark" src="/images/MochaReads-M.png" alt="" width="56" height="51" />
      <h1>We'll be right back</h1>
      <p>MochaReads is temporarily down while we sort out some things on our end.</p>
      <p>Please wait a few minutes and refresh the page.</p>
    </div>
  </main>
</body>
</html>`;

// Excludes static assets so they still serve normally — both because the
// maintenance page above references one of them (the logo) and because
// there's no reason to break asset delivery just because the app itself is
// paused.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|manifest.json|sw.js).*)"],
};

export function proxy() {
  if (!isMaintenanceMode()) {
    return NextResponse.next();
  }

  return new NextResponse(PAGE_HTML, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      // Tells crawlers/clients this is temporary — don't deindex, just
      // retry. Also blocks all cron/webhook routes (Stripe, the digest/
      // push-notification crons) for the duration; Stripe retries failed
      // webhooks with its own backoff over several days, so a brief outage
      // here doesn't lose events, just delays them.
      "Retry-After": "120",
    },
  });
}
