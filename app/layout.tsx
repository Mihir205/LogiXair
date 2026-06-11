import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "./components/ThemeProvider"; 

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
    // 2. CRITICAL: Add suppressHydrationWarning to the <html> tag too.
    // next-themes manages attributes here, so this stops Next.js from complaining.
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="min-h-screen tracking-tight" suppressHydrationWarning>
        {/* 3. Wrap children inside the active configuration provider */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}