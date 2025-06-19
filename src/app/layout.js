import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/Provider";
import Header from "@/components/Header";
import StyledComponentsRegistry from "@/lib/registry";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Bronze",
  description: "Track of all of your favorite news sources in one place",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>
          <StyledComponentsRegistry>
            <Header />
            {children}
          </StyledComponentsRegistry>
        </Providers>
      </body>
    </html>
  );
}
