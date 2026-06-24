import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ultimate Vibe Coder",
  description: "Multiplayer AI-agentic web IDE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
