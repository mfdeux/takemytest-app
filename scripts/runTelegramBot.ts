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
    { command: "support", description: "Get support" },
    { command: "terms", description: "Terms of Service" },
    { command: "privacy", description: "Privacy Policy" },
  ]);

  // await bot.api.setWebhook(
  //   "https://takemytest.massive.sh/api/telegram/webhook",
  //   {
  //     drop_pending_updates: true,
  //   }
  // );
  await bot.api.deleteWebhook();
  await bot.start();
  console.log("Bot setup completed.");
}

main();
