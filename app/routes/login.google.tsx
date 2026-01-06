import { redirect } from "react-router";
import { getGoogleAuthUrl } from "~/lib/services/accounts.server";
import type { Route } from "./+types/login.google";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const googleAuthUrl = getGoogleAuthUrl();
  return redirect(googleAuthUrl);
};

export default function Page() {
  return null; // This route does not render a page, it simply redirects.
}
