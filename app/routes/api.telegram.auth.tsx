import { validateWebAppData } from "@grammyjs/validator";
import { getOrCreateAccount } from "~/lib/services/accounts.server";
import type { Route } from "./+types/api.telegram.auth";

export const action = async ({ request }: Route.ActionArgs) => {
  const { initData } = await request.json();
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;

  if (validateWebAppData(botToken, initData)) {
    const urlParams = new URLSearchParams(initData);
    const user: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      is_premium?: boolean;
    } = JSON.parse(urlParams.get("user") as string);

    await getOrCreateAccount({
      telegramUserId: user.id,
      telegramFirstName: user.first_name,
      telegramLastName: user.last_name || "",
      telegramUsername: user.username || "",
      telegramLanguageCode: user.language_code || "en",
      telegramIsPremium: user.is_premium || false,
    });
  }
  return { success: true };
};

export default function Page() {
  return null;
}
