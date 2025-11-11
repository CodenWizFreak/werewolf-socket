// app/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SocketProvider } from "@/components/socket-provider";
import  MusicButton from "@/components/music-button"; // <-- see step 2
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Werewolf Game",
  description: "Multiplayer Werewolf Game with Real-time Chat and Role-based Gameplay",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geist.className} ${geistMono.className} ${inter.className} font-sans antialiased`}
      >
        <SocketProvider>{children}</SocketProvider>
        <MusicButton /> {/* client component */}
        <Analytics />
      </body>
    </html>
  );
}
