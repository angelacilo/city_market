import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "700"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "BCMIS | Butuan City Market Information System",
  description:
    "Browse all Public Markets in Butuan City, search for products, compare prices, and connect with vendors online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased min-h-screen bg-white text-gray-900 font-sans`}
      >
        <Navbar />
        <main className="min-h-[calc(100vh-3.5rem)] overflow-x-hidden pb-16 md:pb-0">
          {children}
        </main>
        <BottomNav />
        <Footer />
      </body>
    </html>
  );
}
