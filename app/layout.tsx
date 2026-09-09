import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "Shelf Seasons — Reading Journal",
  description:
    "A cozy multilingual reading journal and visual book tracker.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await headers()).get("x-shelf-locale") === "en" ? "en" : "ru";

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased">{children}<PwaRegister /></body>
    </html>
  );
}
