import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  LiveReload,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";

import "./tailwind.css";
import { Toaster } from "@/components/shared/toaster";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Toaster />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        {/* Debug script - remove after fixing */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
      console.log('🔍 Debugging module loading...');
      
      // Test loading the problematic file
      setTimeout(async () => {
        try {
          console.log('📦 Testing dashboard.index module...');
          const module = await import('/assets/dashboard.index-aM_7-ti4.js');
          console.log('✅ dashboard.index loaded successfully:', module);
        } catch (error) {
          console.error('❌ dashboard.index failed to load:', error);
          console.log('🔍 Error details:', {
            message: error.message,
            stack: error.stack
          });
        }
      }, 1000);
    `,
          }}
        />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function HydrateFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading...</div>
    </div>
  );
}
