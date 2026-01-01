import { webhookCallback } from "grammy";
import { getBot } from "~/lib/services/telegram.server";
import type { Route } from "./+types/api.telegram.webhook";

export const action = async ({ request, context }: Route.ActionArgs) => {
  const bot = await getBot();
  return webhookCallback(bot, "std/http")(request);
};

export default function Page() {
  return null;
}
