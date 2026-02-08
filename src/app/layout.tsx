import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Asuka's Cozy Planner",
  description: "A cute, mobile-first planner for trips, events, and todos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
