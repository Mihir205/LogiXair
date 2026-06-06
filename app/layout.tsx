import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weather Intelligence Platform",
  description: "Off-Grid IoT Weather Dashboard & Fleet Analytics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      {/* ADD suppressHydrationWarning HERE */}
      <body className="min-h-screen tracking-tight" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}