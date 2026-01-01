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

        <title>TakeMyTest - Ace Every Test with AI</title>
        <meta
          name="description"
          content="Snap a photo of any test question. Get instant answers and detailed explanations—all through Telegram. Study smarter, not harder."
        />
        <meta name="author" content="TakeMyTest" />
        <meta
          name="keywords"
          content="test helper, homework help, study assistant, AI tutor, test answers, Telegram bot, academic help, student assistant"
        />
        <link rel="canonical" href="https://takemytest.app/" />

        <meta
          property="og:title"
          content="TakeMyTest - Ace Every Test with AI"
        />
        <meta
          property="og:description"
          content="Snap a photo of any test question. Get instant answers and detailed explanations—all through Telegram. Study smarter, not harder."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://takemytest.app/" />
        <meta
          property="og:image"
          content="https://takemytest.app/og-image.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="TakeMyTest" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@TakeMyTest" />
        <meta
          name="twitter:title"
          content="TakeMyTest - Ace Every Test with AI"
        />
        <meta
          name="twitter:description"
          content="Snap a photo of any test question. Get instant answers and detailed explanations—all through Telegram. Study smarter, not harder."
        />
        <meta
          name="twitter:image"
          content="https://takemytest.app/og-image.png"
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
          data-domain="gettakemytest.com"
          data-api="https://intake.massive.sh/api/event"
          src="https://intake.massive.sh/js/script.js"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "TakeMyTest",
              url: "https://gettakemytest.com",
              description:
                "Snap a photo of any test question. Get instant answers and detailed explanations—all through Telegram. Study smarter, not harder.",
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
