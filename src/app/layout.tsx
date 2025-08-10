import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TranscriptProvider } from "@/contexts/TranscriptContext";
import { EventProvider } from "@/contexts/EventContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IELTS Tutor AI",
  description: "AI-powered IELTS essay analysis and tutoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <EventProvider>
          <TranscriptProvider>
            {children}
          </TranscriptProvider>
        </EventProvider>
      </body>
    </html>
  );
}
