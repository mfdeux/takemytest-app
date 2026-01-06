import { redirect } from "react-router";
import { requireAccount } from "~/lib/services/accounts.server";
import type { Route } from "./+types/account.logout";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAccount(request);
  return redirect(`/login`, {
    headers: {
      "Set-Cookie": `${
        process.env.SESSION_COOKIE_KEY as string
      }=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    },
  });
}

export async function action({ request }: Route.ActionArgs) {
  await requireAccount(request);
  return redirect(`/login`, {
    headers: {
      "Set-Cookie": `${
        process.env.SESSION_COOKIE_KEY as string
      }=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    },
  });
}
