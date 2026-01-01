import "dotenv/config";
import { getBot } from "~/lib/services/telegram.server";

async function main() {
  const bot = await getBot();

  await bot.api.setChatMenuButton({
    menu_button: {
      type: "default",
    },
  });

  await bot.api.setMyCommands([
    { command: "start", description: "Restart the bot" },
    { command: "subscription", description: "Manage subscription" },
    { command: "settings", description: "Manage account settings" },
    { command: "usage", description: "View usage statistics" },
    { command: "terms", description: "Terms of Service" },
    { command: "privacy", description: "Privacy Policy" },
  ]);

  await bot.api.setWebhook(
    "https://linecraft-app-1068298120401.us-east1.run.app/api/telegram/webhook",
    {
      drop_pending_updates: true,
    }
  );
  console.log("Bot setup completed.");
}

main();
