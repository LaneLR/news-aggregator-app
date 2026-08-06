import { Roboto } from "next/font/google";
import "./globals.scss";
import Providers from "@/Provider";
import Header from "@/components/Header";
import AppWrapper from "@/components/AppWrapper";
import MainContentWrapper from "@/components/MainContentWrapper";
import Footer from "@/components/Footer";
import ThemeProvider from "@/components/ThemeProvider";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";

const roboto = Roboto({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata = {
  title: "MorningFeeds",
  description:
    "MorningFeeds is a fast, customizable RSS feed reader and news aggregator where you can find and save stories from your favorite news sites all in one place.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({ children }) {
  // Seeding SessionProvider with the server-checked session means every
  // client component's useSession() (Header included) is correct on the
  // very first render — no client-only fetch-and-settle race that can
  // land on a stale "unauthenticated" state until a manual refresh.
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" data-theme={session?.user?.selectedTheme || "default"}>
      <body
        style={{ backgroundColor: "var(--dark-blue)", color: "var(--light-white)" }}
        className={`${roboto.variable}`}
      >
        <Providers session={session}>
          <ThemeProvider>
            <AppWrapper>
              <Header />
              <MainContentWrapper>{children}</MainContentWrapper>
              <Footer />
            </AppWrapper>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
