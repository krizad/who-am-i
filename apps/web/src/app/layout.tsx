import { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WHO KNOW?",
  description: "Real-time Insider Game Controller",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
