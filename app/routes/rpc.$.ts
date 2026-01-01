import handler from "~/lib/orpc/handler.server";
import { maybeAccount } from "~/lib/services/accounts.server";
import type { Route } from "./+types/rpc.$";

export async function loader({ request }: Route.LoaderArgs) {
  const account = await maybeAccount(request);
  const { response } = await handler.handle(request, {
    prefix: "/rpc",
    // @ts-ignore
    context: { account },
  });

  return response ?? new Response("Not Found", { status: 404 });
}

export async function action({ request }: Route.LoaderArgs) {
  const account = await maybeAccount(request);
  const { response } = await handler.handle(request, {
    prefix: "/rpc",
    // @ts-ignore
    context: { account },
  });

  return response ?? new Response("Not Found", { status: 404 });
}
