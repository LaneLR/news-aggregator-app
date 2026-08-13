# ☕ MochaReads

A fast, customizable RSS feed reader and news aggregator built with Next.js. Follow your favorite sources, browse by category, save articles to personal archives, and get notified when topics you follow get covered — all in one ad-free, algorithm-free dashboard.

> **Note on the name:** this project was originally built as "MorningFeeds" and rebranded to MochaReads in August 2026. If you find a stray reference to the old name anywhere, it's a miss — please fix it.

## 🗝️ Key features

**Reading & discovery**
- Articles pulled from hundreds of RSS sources across 14 categories (Business, Tech, Science, Sports, Lifestyle, Entertainment, Politics, World, US, Weather, Finance, Podcast, plus fully subscriber-only Market and Journal)
- Full-text search with suggestions, sort by latest/trending/most-liked, "Most Covered" and "For You" personalized recommendations
- Reader view with customizable font size/family/line-height/content width, full-screen reading mode, text-to-speech, and related-coverage links
- List, magazine, and reader density layouts; drag-to-reorder category nav

**Organization**
- Save articles to custom Archives (collections); share an archive publicly via a read-only link
- Follow or mute keywords — followed keywords surface on `/following` and trigger notifications; muted ones are filtered out everywhere
- Like articles, track read/unread state, "mark all as read," bulk multi-select actions (mark read / save / like) across a whole page

**Content access tiers** *(added 2026-08)*
- Every regular category (Business, Tech, Politics, Finance, etc.) shows a curated selection of well-known/major sources to Free-tier and anonymous visitors — CNN, BBC, NPR, CNBC, and similar — with the rest of that category's sources (the long tail) reserved for Subscribers. This is a per-source `tier` (`free`/`premium`) on `Article`, not a whole-category gate — see `src/lib/subscriberOnlyCategories.js`.
- **Market and Journal are the only two categories still fully gated** — no free sample at all. A Free/anonymous visitor who opens either now sees an in-app upsell teaser (`GatedCategoryTeaser.jsx`, with a custom in-house SVG illustration, not stock photography) explaining what's inside, rather than a bare redirect to `/pricing`.
- **Podcasts are always free**, regardless of `tier` — `sourceType: "podcast"` is an unconditional bypass everywhere gating is enforced.
- A small, non-dismissible nudge ("You're seeing a curated free selection... Subscribe to unlock every source in this category") appears on every partially-gated category page for non-subscribers, linking to `/pricing`.

**Market data** *(Subscribed tier)*
- Live market indices, sector performance, a personal watchlist, and historical charts, backed by Finnhub with server-side caching (`MarketQuote`/`MarketChartCache`)

**Local weather**
- Optional, opt-in current-conditions widget on `/news` (temperature + short description) — no radar, alerts, or forecast beyond right now, and no push notifications. Location is a city you search for and pick yourself, stored in `localStorage`, never inferred from IP/geolocation. Backed by OpenWeatherMap; the widget simply doesn't render if `OPENWEATHER_API_KEY` isn't set.

**Notifications**
- Web Push notifications (self-hosted VAPID keys, no third-party push service) when a followed keyword gets new coverage
- Daily or weekly email digest (Resend), scoped to a specific custom Feed or to your general picks/trending

**Power-user tools**
- Command palette (`Ctrl`/`Cmd`+K) for fast navigation and search
- Fully customizable keyboard shortcuts (`j`/`k` navigate, `o` open, `s` save, `l` like, `/` search, `?` help — all rebindable in Settings)
- OPML import/export for your followed feeds

**Accounts & billing**
- Email/password auth with verification + password reset, and Google OAuth, via NextAuth v5
- Single Free / Subscribed tier via Stripe (monthly or annual billing), self-serve billing portal, referral program with credit toward future bills, "cancel anytime" — no forced annual lock-in
- Soft account deletion: request deletion, get a grace period to cancel, then a scheduled cron job finalizes it

**Sharing & installability**
- Article share cards (Web Share API with clipboard/email/SMS fallback), Web Share Target so the app itself appears as a share destination on mobile
- Installable as a PWA (manifest + service worker), light/dark theme (follows system preference by default, overridable per-account)

**Onboarding & accessibility**
- Guided first-run onboarding covering topic/source picks and a feature tour
- WCAG AA-verified color contrast across both themes, real focus-trapping in every modal/dialog, full keyboard navigability

## 🏗️ Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Database | PostgreSQL (Neon), via Sequelize |
| Auth | NextAuth v5 (beta) — Credentials + Google OAuth, JWT sessions |
| Payments | Stripe (Checkout + Billing Portal + webhooks) |
| Email | Resend |
| Push notifications | `web-push` (self-generated VAPID keypair) |
| Market data | Finnhub API |
| Error monitoring | Sentry |
| Product analytics | PostHog |
| Styling | SCSS Modules, CSS custom properties for theming |
| Testing | Vitest + React Testing Library |

## 🧩 Architecture notes

- **RSS ingestion is a separate service**, not part of this repo — see the sibling `rss-fetch-app` project. It shares this app's database and (once launched) runs on a GitHub Actions schedule (not Vercel Cron), fetching and normalizing articles from `feeds/*.json` source lists into the shared `Article` table. **The hourly schedule is currently disabled** (manual-only, `.github/workflows/scrape.yml`) pending launch — new/updated articles only appear when someone triggers a run by hand until it's re-enabled.
- **`urlToImage` isn't always real** — `rss-fetch-app`'s `extractImage()` pulls it from whatever a feed happens to provide (`media:content`, `media:thumbnail`, an `<img>` in the description, etc.), and feeds vary wildly in what they actually put there: share-button icons, tracking pixels, a podcast's audio enclosure, even a video stream URL for video segments. `extractImage()` filters known-bad patterns out at ingestion time, but a feed with no real per-article image at all (TMZ, for instance — the feed genuinely doesn't include one) is expected and correctly falls through to a placeholder, not a bug to chase on this side.
- **The "no image" placeholder is category-tinted, not one flat image.** `public/images/placeholders/*.png` holds one PNG per category (`getCategoryPlaceholderImage()` in `src/lib/categoryColors.js` picks the right one from an article's category), each produced by tinting a single base glyph with that category's own badge color — a duotone-filter effect, not a separately hand-designed image per category. An article with no category (or one that isn't in `CATEGORY_COLORS`) falls back to `/images/blurimage.png`, tinted the same way with the site's brand color. There's no live generation script kept in the repo for these — they're a one-off output (like the favicon/OG image), regenerate by tinting the same base SVG glyph again if `CATEGORY_COLORS` changes.
- **A category is not just a frontend string.** It's duplicated across `src/lib/homeSections.js` (`CATEGORY_SECTION_TAGS`), `HeaderNavBar.jsx`/`HomePage.jsx`/`NewNewsPage.jsx`'s own icon/label maps, `src/app/sitemap.js`'s `FREE_CATEGORIES`, `src/lib/categoryColors.js`, a `src/app/category/<slug>/` route folder, every `rss-fetch-app/feeds/*.json` entry tagged with it, and every already-ingested `Article.category` row (plus any `User.preferredCategories`/`homeSections` that reference it). Renaming one (e.g. Health → Lifestyle, 2026-08) means updating all of the above, including a live `UPDATE ... array_replace(category, 'Old', 'New')` against both tables — a name that only changes in the frontend leaves existing rows and any saved user preferences silently orphaned under the old name.
- **`CATEGORY_COLORS` in `categoryColors.js` has a few keys with no live category page** (currently `Gaming`, `Food`, `Economy`) — leftover from feed sources tagged with them before those categories existed as real site sections, or reserved ahead of a category that hasn't been built yet. `Gaming` in particular already has ~19 real sources flowing into the DB (IGN, Polygon, Kotaku, PC Gamer, etc.) with nowhere to be shown — a real, ready-made next category if one ever gets added, not dead config.
- **`Article.tier` (`free`/`premium`) is set at ingestion time** from each source's own entry in `rss-fetch-app/feeds/*.json` (an explicit `"tier": "premium"` field, or the default `"free"` when omitted) — it is *not* re-derived or corrected client-side. Changing a source's tier (e.g. deciding CNBC should go premium) means editing its feed-config entry; the change only reaches already-ingested rows once that feed's next fetch cycle re-upserts them (`Article.upsert()` updates all fields on conflict), not retroactively. A bulk `UPDATE "Articles" SET tier = ...` is the only way to apply a tier change to historical rows immediately.
- **This repo's own scheduled jobs** (`vercel.json`) run on Vercel Cron: `delete-users` (finalizes soft-deleted accounts), `send-digests` (daily/weekly email digest), `send-push-notifications` (followed-keyword alerts).
- **Vercel's free Hobby plan prohibits commercial/revenue-generating use** — once Stripe billing goes live (it currently runs in sandbox/test mode), this needs to run on a Pro plan or above.
- **Maintenance mode (`MAINTENANCE_MODE=true`) is a manual incident-response switch, not automatic health detection.** `src/middleware.js` checks it on every request and, when set, returns a fully static, self-contained HTML response directly — before Next.js ever renders the root layout. That's deliberate: the root layout's `auth()` call hits the database on most requests (see `src/lib/auth.js`'s `jwt` callback), so a "custom maintenance page" rendered through the normal app shell would itself throw if the database is what's actually down. Bypassing layout/auth/React entirely means this keeps working exactly when it's needed most — a dead DB, a bad deploy that passed the build but breaks at runtime, or the app timing out under load. It also 503s every route including cron/webhook endpoints for the duration; Stripe retries failed webhooks with its own backoff over several days, so a brief window here doesn't lose events. Toggling it (on or off) requires a Vercel redeploy to pick up the env var change — this is intentionally simple rather than instant (e.g. Vercel Edge Config), matching this project's low-maintenance priority; a full platform-level outage (Vercel itself down) isn't something this — or anything else — can paper over.
- **Schema changes are applied manually.** There's no migration tool — after changing a model in `src/lib/models/`, run `npm run db:sync` once (see that script's own comments for why it's not automatic).
- **Fonts (Roboto, Lora) are self-hosted**, not fetched via `next/font/google` — the `.woff2` files live in `src/app/fonts/` and are loaded with `next/font/local`. This is deliberate: `next/font/google` fetches font files from `fonts.gstatic.com` at *build* time, which failed a real CI build outright when that request didn't go through. To add a weight/style, pull the matching file from the `@fontsource/roboto` / `@fontsource/lora` npm packages (install with `--no-save`, copy the file out, uninstall) rather than switching back to `next/font/google`.
- **Lora, not Roboto, is the site-wide UI font** (`globals.scss`'s `body` rule) — chosen over the more generic Roboto for a more distinct, editorial feel across the whole app, not just article titles/headlines. Roboto is still self-hosted and loaded, since the article reader's font-preference toggle (`readerPrefs.js`) offers it as an alternate reading font alongside Lora.
- **`globals.scss` resets `font-family: inherit` on `button`/`input`/`select`/`textarea`/`optgroup`.** Browsers don't inherit the page's font into form controls by default (they use the OS UI font instead) — without this reset, text typed into any input and the label on any button silently falls back off Lora, which is easy to miss since it only shows up on interactive elements, not static text.

## 🚀 Getting started

### Prerequisites
- Node.js 22+
- A PostgreSQL database (this project targets Neon specifically, but any Postgres instance will work)

### Setup

```bash
npm install
cp .env.example .env   # if present — otherwise create .env with the variables below
npm run db:sync        # applies the current model schema to your database
npm run dev
```

The app runs at `http://localhost:3000`.

### Environment variables

| Variable | Required for | Notes |
|---|---|---|
| `DATABASE_URL` | Everything | Postgres connection string |
| `NEXT_PUBLIC_BASE_URL` | Everything | Public site URL (`http://localhost:3000` in dev) |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | Auth | NextAuth session signing |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in | From Google Cloud Console OAuth credentials |
| `CRON_SECRET` | Scheduled jobs | Shared secret the cron routes check for |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional & digest email | Free Resend tier: 3,000 emails/mo, 100/day |
| `CONTACT_EMAIL` | Contact/legal pages, footer | Just a display address |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Billing | Use Stripe test-mode keys until ready to go live |
| `FINNHUB_API_KEY` | Market/Finance pages | Free tier: 60 calls/min |
| `OPENWEATHER_API_KEY` | Local weather widget | Optional — the widget just doesn't render (no error) if unset. Free tier: 1,000 calls/day |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Push notifications | Self-generated: `npx web-push generate-vapid-keys`. Regenerating invalidates every existing push subscription. |
| `NEXT_PUBLIC_SENTRY_DSN` | Error monitoring | Leave blank to disable |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Sentry source-map upload | Build-time only; build degrades gracefully without them |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | Product analytics | Leave the key blank to disable; host defaults to the US region |
| `MAINTENANCE_MODE` | Incident response | Optional, unset by default. Set to the literal string `true` (in Vercel's dashboard, then redeploy) to take the whole site down to a static maintenance page — see `src/middleware.js`. Unset it and redeploy again to bring the site back. |

None of these need to be set to run the test suite — see Testing below.

## 📜 Available scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | **Runs the full test suite, then builds for production** — a failing test blocks the build (and blocks Vercel's deploy, since it reads this same script) |
| `npm start` | Start the production server (after `build`) |
| `npm run lint` | ESLint |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with a coverage report |
| `npm run db:sync` | Apply the current model schema to the database (run manually after changing a model) |
| `npm run seed` | Seed demo users (development only) |

## ✅ Testing

Every feature, file, and behavior change ships with its own test — this is enforced by `npm run build` failing on a red test suite, not just convention.

- **Framework:** Vitest + React Testing Library, colocated tests (`Foo.jsx` → `Foo.test.jsx` right next to it).
- **Shared test infrastructure** lives in `src/test/`: `dbMock.js` (mocks the Sequelize model API so tests exercise app logic, not the ORM itself), `fixtures.js` (consistent fake data factories), `modelTestUtils.js` (lets `src/lib/models/*.js` files be unit-tested against a disconnected Sequelize instance — validators/defaults/setters, without a live DB connection).
- **Coverage target:** ~90%, enforced as a threshold in `vitest.config.js` (currently sitting around 94% statements / 87% branches / 90% functions / 96% lines).
- App Router `page`/`layout` files that contain JSX are named `.jsx`, not `.js` — Vite's transform (which Vitest uses) only parses JSX in `.jsx`/`.tsx` files, even though Next.js itself accepts either extension. Keep new ones consistent with this.

## 📁 Project structure

```
src/
  app/            # Next.js App Router — pages, layouts, API routes
    api/          # ~65 route handlers (auth, archives, articles, stripe, cron, market, users, ...)
  components/     # ~90 React components (colocated .module.scss + .test.jsx)
  lib/            # Models, business logic, hooks — mostly framework-agnostic
    models/       # Sequelize model definitions
  styles/         # themes.scss (CSS custom properties) + themes.js (JS mirror for ThemeSelector)
  test/           # Shared test mocks/fixtures/utilities
  utils/          # Standalone Node scripts (seeding, migrations, scheduled cleanup)
public/
  images/         # Static assets, including the MochaReads logo family
```

## ☁️ Deployment

Deployed on Vercel. `npm run build` is the build command Vercel invokes, so the test suite gates every deploy automatically. Scheduled jobs run via `vercel.json`'s `crons` config — see Architecture notes above for what each one does and why RSS ingestion isn't among them.
