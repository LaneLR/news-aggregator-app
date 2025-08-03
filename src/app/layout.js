import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/Provider";
import Header from "@/components/Header";
import StyledComponentsRegistry from "@/lib/registry";
import AppWrapper from "@/components/AppWrapper";
import MainContentWrapper from "@/components/MainContentWrapper";
import SessProvider from "@/components/SessionProvider";
import Footer from "@/components/Footer";
import HeaderNavBar from "@/components/HeaderNavBar";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Relay News",
  description:
    "Relay News is a fast, customizable RSS feed reader and news aggregator that lets you track, read, and save stories from top news websites in one place.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{ backgroundColor: "var(--dark-blue)", color: "black" }}
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        <Providers>
          <StyledComponentsRegistry>
            <AppWrapper>
              <Header />
              <MainContentWrapper>
                <SessProvider>{children}</SessProvider>
              </MainContentWrapper>
              <Footer />
            </AppWrapper>
          </StyledComponentsRegistry>
        </Providers>
      </body>
    </html>
  );
}
