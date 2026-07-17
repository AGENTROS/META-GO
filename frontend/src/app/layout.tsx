import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import HydrationFix from "@/components/HydrationFix";

export const metadata: Metadata = {
  title: "Meta Go — Sovereign Identity Protocol",
  description: "Zero-Knowledge biometric identity infrastructure for Web3 and the Metaverse.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Suppress chrome-extension errors from triggering the Next.js error overlay
            const originalConsoleError = console.error;
            console.error = function(...args) {
              const err = args[0];
              if (typeof err === 'string' && err.includes('chrome-extension://')) return;
              if (err && err.stack && err.stack.includes('chrome-extension://')) return;
              if (err && err.message && err.message.includes('chrome-extension://')) return;
              originalConsoleError.apply(console, args);
            };
            window.addEventListener('error', function(e) {
              if (e.filename && e.filename.includes('chrome-extension://')) {
                e.stopImmediatePropagation();
                e.preventDefault();
              } else if (e.error && e.error.stack && e.error.stack.includes('chrome-extension://')) {
                e.stopImmediatePropagation();
                e.preventDefault();
              }
            }, true);
            window.addEventListener('unhandledrejection', function(e) {
              if (e.reason && e.reason.stack && e.reason.stack.includes('chrome-extension://')) {
                e.stopImmediatePropagation();
                e.preventDefault();
              }
            }, true);
          `
        }} />
      </head>
      <body suppressHydrationWarning>
        <HydrationFix />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
