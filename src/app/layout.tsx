import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GeoGuess — World Geography Game",
  description: "A polished GeoGuessr-style geography game. Guess locations from photos, play with friends in real-time or via challenge links.",
  keywords: "geography game, geoguessr, world map, location guessing, multiplayer",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GeoGuess",
  },
  openGraph: {
    title: "GeoGuess — World Geography Game",
    description: "Guess locations from photos and compete with friends around the world.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0f",
};

export default function RootLayout({ children }: { children: import("react").ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
