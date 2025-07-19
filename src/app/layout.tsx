import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";
import { Header } from "@/components/Header";
import { ReactNode } from 'react';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Akrix.ai Receipt Generator",
  description: "Professional receipt generation system for Akrix.ai - Generate, download, and manage receipts with ease",
  keywords: ["receipt", "generator", "payment", "akrix", "invoice", "pdf"],
  authors: [{ name: "Akrix.ai" }],
  creator: "Akrix.ai",
  publisher: "Akrix.ai",
  robots: "index, follow",
  openGraph: {
    title: "Akrix.ai Receipt Generator",
    description: "Professional receipt generation system for Akrix.ai",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Akrix.ai Receipt Generator",
    description: "Professional receipt generation system for Akrix.ai",
  },
  icons: {
    icon: "/akrix-logo.png",
    shortcut: "/akrix-logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black min-h-screen">
        <div className="min-h-screen flex flex-col items-center justify-center w-full px-2 sm:px-4 md:px-8">
          {children}
        </div>
      </body>
    </html>
  );
}
