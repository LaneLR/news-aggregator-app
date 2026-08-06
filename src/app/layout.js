import { Roboto } from "next/font/google";
import "./globals.css";
import Providers from "@/Provider";
import Header from "@/components/Header";
import StyledComponentsRegistry from "@/lib/registry";
import AppWrapper from "@/components/AppWrapper";
import MainContentWrapper from "@/components/MainContentWrapper";
import AuthProvider from "@/components/SessionProvider";
import Footer from "@/components/Footer";
import ThemeProvider from "@/components/ThemeProvider";

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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{ backgroundColor: "var(--dark-blue)", color: "var(--light-white)" }}
        className={`${roboto.variable}`}
      >
        <Providers>
          <StyledComponentsRegistry>
            <AuthProvider>
              <ThemeProvider>
                <AppWrapper>
                  <Header />
                  <MainContentWrapper>{children}</MainContentWrapper>
                  <Footer />
                </AppWrapper>
              </ThemeProvider>
            </AuthProvider>
          </StyledComponentsRegistry>
        </Providers>
      </body>
    </html>
  );
}
