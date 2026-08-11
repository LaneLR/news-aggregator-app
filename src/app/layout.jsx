import localFont from "next/font/local";
import "./globals.scss";
import Providers from "@/Provider";
import Header from "@/components/Header";
import AppWrapper from "@/components/AppWrapper";
import MainContentWrapper from "@/components/MainContentWrapper";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import ThemeProvider from "@/components/ThemeProvider";
import PostHogProvider from "@/components/PostHogProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import JsonLd from "@/components/JsonLd";
import KeyboardShortcutsProvider from "@/components/KeyboardShortcutsProvider";
import CommandPalette from "@/components/CommandPalette";
import ToastProvider from "@/components/ToastProvider";
import ConfirmDialogProvider from "@/components/ConfirmDialogProvider";
import { auth } from "@/lib/auth";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MochaReads",
  url: BASE_URL,
  logo: `${BASE_URL}/images/MochaReads-favicon.png`,
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "MochaReads",
  url: BASE_URL,
};

// Self-hosted (next/font/local) rather than next/font/google — the
// google variant fetches the actual font files from fonts.gstatic.com at
// *build* time (not runtime; the eventual output is self-hosted either
// way), which failed the build outright in CI when that request didn't go
// through. These files are the same Roboto/Lora weights & the latin
// subset, pulled once from the (Google-published, OFL-licensed)
// @fontsource/roboto and @fontsource/lora packages — see the comment in
// README.md's font section before changing weights/styles here, since
// adding one means pulling in another local file, not just tweaking a
// config option.
const roboto = localFont({
  src: [
    { path: "./fonts/Roboto-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Roboto-Italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/Roboto-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Roboto-BoldItalic.woff2", weight: "700", style: "italic" },
  ],
  display: "swap",
  variable: "--font-roboto",
});

// Editorial serif used selectively for article titles and section
// headings (via the `.headline` utility class) — sans-serif everywhere
// else for UI chrome. This pairing is what most polished news/reader
// products (and print-derived publications generally) use to read as
// "a publication" rather than "a generic app."
const lora = localFont({
  src: [
    { path: "./fonts/Lora-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Lora-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Lora-Bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-lora",
});

const DEFAULT_DESCRIPTION =
  "MochaReads is a fast, customizable RSS feed reader and news aggregator where you can find and save stories from your favorite news sites all in one place.";

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "MochaReads — Your News, All in One Place",
    template: "%s | MochaReads",
  },
  description: DEFAULT_DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
    apple: "/images/icon-192.png",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "MochaReads",
    title: "MochaReads — Your News, All in One Place",
    description: DEFAULT_DESCRIPTION,
    images: [{ url: "/images/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MochaReads — Your News, All in One Place",
    description: DEFAULT_DESCRIPTION,
    images: ["/images/og-image.png"],
  },
};

export const viewport = {
  themeColor: "#6f4225",
};

export default async function RootLayout({ children }) {
  // Seeding SessionProvider with the server-checked session means every
  // client component's useSession() (Header included) is correct on the
  // very first render — no client-only fetch-and-settle race that can
  // land on a stale "unauthenticated" state until a manual refresh.
  const session = await auth();

  // No data-theme attribute at all when the user hasn't explicitly chosen —
  // themes.scss then follows prefers-color-scheme via a media query (pure
  // CSS, evaluated at first paint, no flash) instead of defaulting everyone
  // to light.
  return (
    <html lang="en" data-theme={session?.user?.selectedTheme || undefined}>
      <body
        style={{ backgroundColor: "var(--dark-blue)", color: "var(--light-white)" }}
        className={`${roboto.variable} ${lora.variable}`}
      >
        <a href="#main-content" className="skipLink">
          Skip to main content
        </a>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        <Providers session={session}>
          <PostHogProvider>
            <ThemeProvider>
              <ToastProvider>
                <ConfirmDialogProvider>
                  <KeyboardShortcutsProvider>
                    <AppWrapper>
                      <Header />
                      <MainContentWrapper>{children}</MainContentWrapper>
                      <Footer />
                      <MobileTabBar />
                    </AppWrapper>
                    <CommandPalette />
                  </KeyboardShortcutsProvider>
                </ConfirmDialogProvider>
              </ToastProvider>
            </ThemeProvider>
          </PostHogProvider>
        </Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
