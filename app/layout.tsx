import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solar Calculator",
  description: "Estimate the solar panels and battery storage you need.",
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
