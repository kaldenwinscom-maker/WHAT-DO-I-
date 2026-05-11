import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WHAT DO I? — Party Games",
  description: "25 epic party games for any group. Never Have I Ever, Truth or Dare, Werewolf, Trivia, and more — all in one app.",
  keywords: "party games, never have i ever, truth or dare, werewolf, party app, group games",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WHAT DO I?",
  },
  openGraph: {
    title: "WHAT DO I? — Party Games",
    description: "25 epic party games. Play anywhere, anytime.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0612",
};

export default function RootLayout({ children }: { children: import("react").ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
