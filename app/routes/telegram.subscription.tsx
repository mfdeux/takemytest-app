import { redirect } from "react-router";
import {
  createAuthenticationToken,
  getAccountByOneTimeToken,
  maybeAccount,
} from "~/lib/services/accounts.server";
import {
  createBillingPortalSession,
  getStripeSubscriptionSession,
} from "~/lib/services/billing.server";
import type { Route } from "./+types/telegram.subscription";

export async function loader({ request }: Route.LoaderArgs) {
  let account = await maybeAccount(request);
  if (!account) {
    const searchParams = new URL(request.url).searchParams;
    const token = searchParams.get("token") || "";
    if (!token) {
      throw new Response("Unauthorized", { status: 401 });
    }
    const account = await getAccountByOneTimeToken(token);
    if (!account) {
      throw new Response("Unauthorized", { status: 401 });
    }
    const authToken = createAuthenticationToken({ accountId: account.id });
    const expirationDate = new Date();
    expirationDate.setTime(
      expirationDate.getTime() + 365 * 24 * 60 * 60 * 1000
    );
    const expires = expirationDate.toUTCString();
    return redirect("/telegram/subscription", {
      headers: {
        "Set-Cookie": `${
          process.env.SESSION_COOKIE_KEY as string
        }=${authToken}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`,
      },
    });
  }
  if (
    !account.stripeSubscriptionId ||
    account.subscriptionStatus !== "active"
  ) {
    const url = await getStripeSubscriptionSession({ account });
    return redirect(url.sessionUrl as string);
  } else {
    const url = await createBillingPortalSession({ account });
    return redirect(url as string);
  }
}

export default function Page() {
  return <div>Subscription</div>;
}
