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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,300..900,0..100&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen tracking-tight" suppressHydrationWarning>
        {/* 3. Wrap children inside the active configuration provider */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}