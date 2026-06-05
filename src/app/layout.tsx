import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { ProfileProvider } from "@/context/ProfileContext";
import { AuthProvider } from "@/context/AuthContext";
import { AuthGate } from "@/components/AuthGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ஞானி — Intelligent Coaching by Sasi Rekha",
  description: "Sasi Rekha-வின் AI coaching engine. பூஜ்ஜியத்தில் இருந்து மறுக்க முடியாத Offer வரை — 9 படிகளில்.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ta"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex bg-bg-primary text-text-primary">
        <AuthProvider>
          <AuthGate>
            <ProfileProvider>
              <Sidebar />
              <main className="flex-1 ml-64 min-h-screen">{children}</main>
            </ProfileProvider>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
