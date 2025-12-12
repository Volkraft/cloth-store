import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.scss";
import Providers from "../components/Providers";
import Header from "../components/Header";
import localFont from "next/font/local";

const beatriceDeckTrial = localFont({
  src: "../public/fonts/Beatrice Deck Trial.woff2",
  variable: "--font-beatrice-deck-trial",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clothing Store",
  description: "Магазин одежды на Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body 
        className={`${beatriceDeckTrial.variable} ${geistSans.variable} antialiased`}
      >
        <Providers>
          <Header />
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}

