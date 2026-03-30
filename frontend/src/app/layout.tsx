import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  weight: ["400", "700"],
  subsets: ["devanagari"],
});

export const metadata: Metadata = {
  title: "Chanda-Melodic Sanskrit Recitation",
  description: "Ancient Supercomputer analyzing divine language grid",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${notoSansDevanagari.variable} antialiased bg-void text-primary`}
      >
        {children}
      </body>
    </html>
  );
}
