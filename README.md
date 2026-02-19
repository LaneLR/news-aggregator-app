# 📰 News Aggregator App

This is a full-featured news aggregation web app built with Next.js and React. It collects open-source articles from multiple sources and RSS feeds, indexes and serves them in a responsive UI, and provides user accounts, saved-article archives, Stripe subscriptions and payments, and background processing for feed updates and maintenance.

## 🗝️ Key features

- Feed retrieval and ingestion
  - Periodic article retrieval via cron jobs and background workers that poll external feeds (RSS, JSON APIs, Reddit) and create normalized article records.
  - Background workers/processes handle parsing, deduplication, enrichment and indexing of incoming articles so the web app remains responsive.

- User accounts & authentication
  - Email/password registration and login flows, password reset and email verification.
  - OAuth (Google sign-in) and session management via a session provider.

- Articles, archives & likes
  - Users can save articles to personal archives (collections) for later reading.
  - Like and quickly access recently liked or saved articles.
  - Archive management UI to create, delete and organize saved articles.

- Search & discovery
  - Full site search with filters and paginated results.
  - Category and tag pages, curated home feeds and related-article widgets.

- Reddit integration
  - Special handling for Reddit-sourced content and cards/components to display Reddit posts.

- Subscription billing & payments
  - Pricing page, tier cards, and subscription management UI.
  - Stripe integration with webhook handling for payment events and subscription lifecycle updates.

- Admin / maintenance utilities
  - Scheduled scripts (e.g., cleanup of expired users, fetch new articles)

## 🏗️ Architecture & tech stack

- Next.js (App Router) + React
- Server-side API routes (Next.js API routes) for webhooks, auth and feeds
- Sequelize (or another ORM) for relational DB access 
- Stripe for payments and webhooks 
- Background workers / sagas for feed ingestion and long-running tasks
- Cron/scheduled jobs for periodic maintenance 
