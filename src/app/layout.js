import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/Provider";
import Header from "@/components/Header";
import StyledComponentsRegistry from "@/lib/registry";
import AppWrapper from "@/components/AppWrapper";
import MainContentWrapper from "@/components/MainContentWrapper";
import SessProvider from "@/components/SessionProvider";
import Footer from "@/components/Footer";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Bronze - News Aggregator",
  description: "Track of all of your favorite news sources in one place",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{ backgroundColor: "lightgray", color: "black" }}
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
