// app/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { SocketProvider } from "@/components/socket-provider";
import MusicButton from "@/components/music-button";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Werewolf Game",
  description: "Multiplayer Werewolf Game with Real-time Chat and Role-based Gameplay",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`
          ${geist.className} 
          ${geistMono.className} 
          ${inter.className} 
          font-sans antialiased
          relative min-h-screen
          bg-[url('/wallpaper.jpg')]
          bg-cover bg-center bg-no-repeat bg-fixed
        `}
      >

        {/* Main app content */}
        <SocketProvider>{children}</SocketProvider>

        <MusicButton />
      </body>
    </html>
  );
}
