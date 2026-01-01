import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { Toaster } from "~/components/ui/sonner";

import type { Route } from "./+types/root";
import "./app.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <title>Linecraft - Your Unfair Advantage in Dating</title>
        <meta
          name="description"
          content="Upload any dating profile or conversation. Get pickup lines, replies, and date ideas that actually work—instantly via Telegram."
        />
        <meta name="author" content="Linecraft" />
        <meta
          name="keywords"
          content="dating assistant, pickup lines, conversation starters, dating app help, Telegram bot, AI dating coach"
        />
        <link rel="canonical" href="https://linecraft.app/" />

        <meta
          property="og:title"
          content="Linecraft - Your Unfair Advantage in Dating"
        />
        <meta
          property="og:description"
          content="Upload any dating profile or conversation. Get pickup lines, replies, and date ideas that actually work—instantly via Telegram."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://linecraft.app/" />
        <meta
          property="og:image"
          content="https://linecraft.app/og-image.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Linecraft" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Linecraft" />
        <meta
          name="twitter:title"
          content="Linecraft - Your Unfair Advantage in Dating"
        />
        <meta
          name="twitter:description"
          content="Upload any dating profile or conversation. Get pickup lines, replies, and date ideas that actually work—instantly via Telegram."
        />
        <meta
          name="twitter:image"
          content="https://linecraft.app/og-image.png"
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        ></link>
        <script
          defer
          data-domain="getlinecraft.com"
          data-api="https://intake.massive.sh/api/event"
          src="https://intake.massive.sh/js/script.js"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Linecraft",
              url: "https://getlinecraft.com",
              description:
                "Upload any dating profile or conversation. Get pickup lines, replies, and date ideas that actually work—instantly via Telegram.",
            }),
          }}
        />

        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
