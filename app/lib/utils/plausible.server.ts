export async function trackPageview({ request }: { request: Request }) {
  const plausibleEndpoint = "https://plausible.io/api/event";
  const domain = process.env.SITE_DOMAIN;

  const url = new URL(request.url);
  const pageUrl = url.href;
  const userAgent = request.headers.get("User-Agent");
  const ipAddress =
    request.headers.get("X-Forwarded-For") ||
    request.headers.get("CF-Connecting-IP") ||
    undefined;
  try {
    await fetch(plausibleEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": userAgent || "",
        "X-Forwarded-For": ipAddress || "",
      },
      body: JSON.stringify({
        name: "pageview",
        url: pageUrl,
        domain,
      }),
    });
  } catch (error) {
    console.error("Error tracking pageview:", error);
  }
}
