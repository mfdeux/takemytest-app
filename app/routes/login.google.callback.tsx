import { redirect } from "react-router";
import {
  authenticateWithGoogle,
  createAuthenticationToken,
} from "~/lib/services/accounts.server";
import type { Route } from "./+types/login.google.callback";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectTo =
    url.searchParams.get("state") || process.env.LOGIN_SUCCESS_REDIRECT;

  if (!code) {
    throw new Response("Authorization code missing", { status: 400 });
  }

  try {
    // Exchange the authorization code for user info
    const account = await authenticateWithGoogle(code);
    const token = createAuthenticationToken({ accountId: account.id });
    const expirationDate = new Date();
    expirationDate.setTime(
      expirationDate.getTime() + 365 * 24 * 60 * 60 * 1000
    );
    const expires = expirationDate.toUTCString();
    return redirect(redirectTo as string, {
      headers: {
        "Set-Cookie": `${
          process.env.SESSION_COOKIE_KEY as string
        }=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`,
      },
    });
  } catch (error) {
    console.error("Failed to authenticate with Google:", error);
    return redirect("/login?error=authentication_failed");
  }
};

export default function Callback() {
  return null; // This route does not render a page, it simply handles the callback logic.
}
