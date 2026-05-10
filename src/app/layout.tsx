import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WHAT — AI Agency Platform",
  description: "Scale your business with AI employees. Deploy intelligent agents for marketing, sales, support, and operations.",
  keywords: "AI agency, AI agents, workflow automation, AI platform, SaaS",
  openGraph: {
    title: "WHAT — AI Agency Platform",
    description: "Scale your business with AI employees",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
