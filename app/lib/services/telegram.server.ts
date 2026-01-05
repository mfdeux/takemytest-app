import prisma from "../utils/prisma.server";

import { addDays } from "date-fns";
import type { Account } from "generated/prisma/client";
import { Bot, Composer, Context, type NextFunction } from "grammy";
import graphileWorker from "../utils/graphile.server";
import logger from "../utils/logger.server";
import {
  generateAccountOneTimeToken,
  getOrCreateAccount,
} from "./accounts.server";
import { cancelAccountSubscription } from "./billing.server";

// Define the shape of your custom data
interface CustomSession {
  account: Account;
}

// Merge the default Context with your custom data
export type MyContext = Context & {
  session: CustomSession;
};

async function subscriptionCheck(ctx: Context, next: NextFunction) {
  const telegramUserId = ctx.from?.id;
  if (!telegramUserId) return next();

  const account = await prisma.account.findUnique({
    where: { telegramUserId },
  });

  if (!account) {
    await ctx.reply(
      "❌ You are not linked. Please use the 'Connect' button on the website first."
    );
    return;
  }

  const isActive =
    account &&
    account.subscriptionStatus === "active" &&
    account.subscriptionPeriodEnd &&
    account.subscriptionPeriodEnd > new Date();

  if (isActive) {
    const recentUsage = await prisma.tokenUsage.aggregate({
      where: {
        accountId: account.id,
        createdAt: {
          gte: addDays(new Date(), -14),
        },
      },
      _sum: {
        totalTokens: true,
      },
    });

    const tokensUsed = recentUsage._sum.totalTokens || 0;

    // If they have an active subscription but have used more than 100,000 tokens in the last week
    if (tokensUsed >= 1_000_000) {
      return ctx.reply(
        `You have used too many tokens recently\\. Please wait before sending more requests\\.`,
        { parse_mode: "MarkdownV2" }
      );
    }
    return next();
  }

  if (account.messagesRemaining > 0) {
    // Proceed to the next middleware or handler
    return next();
  }

  const token = await generateAccountOneTimeToken(account.id);

  // 4. IF INACTIVE: Block them and show the Paywall
  return ctx.reply(
    `🔒 *Subscription Required*\n\nYou need an active subscription to chat further with me\\. Manage your subscription [here](${process.env.BASE_SERVER_URL}/telegram/subscription?token=${token})\\.`,
    { parse_mode: "MarkdownV2" }
  );
}

export async function getBot() {
  const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN!);

  bot.command("start", async (ctx) => {
    logger.info(`Received /start from ${JSON.stringify(ctx.from)}}`);
    const account = await getOrCreateAccount({
      telegramUserId: ctx.from!.id,
      telegramFirstName: ctx.from!.first_name,
      telegramLastName: ctx.from!.last_name || "",
      telegramUsername: ctx.from!.username || "",
      telegramLanguageCode: ctx.from!.language_code || "en",
      telegramIsPremium: ctx.from!.is_premium || false,
    });
    logger.info(`Account created or retrieved: ${JSON.stringify(account.id)}`);
    return ctx.reply(
      "Welcome to TakeMyTest! Just type/send an image of a test question to get started. 🚀"
    );
  });

  bot.command("terms", (ctx) => {
    logger.info(`Received /terms from ${ctx.from?.id}`);
    return ctx.reply(
      `Visit [Terms of Service](${process.env.BASE_SERVER_URL}/legal/terms) for assistance\\.`,
      { parse_mode: "MarkdownV2" }
    );
  });

  bot.command("privacy", (ctx) => {
    logger.info(`Received /privacy from ${ctx.from?.id}`);
    return ctx.reply(
      `Visit [Privacy Policy](${process.env.BASE_SERVER_URL}/legal/privacy) for assistance\\.`,
      { parse_mode: "MarkdownV2" }
    );
  });

  bot.command("support", (ctx) => {
    logger.info(`Received /support from ${ctx.from?.id}`);
    return ctx.reply(
      `For support, message our founder Marc [here](https://t.me/mfdeux)\\.`,
      { parse_mode: "MarkdownV2" }
    );
  });

  bot.command("settings", async (ctx) => {
    logger.info(`Received /settings from ${ctx.from?.id}`);
    const account = await prisma.account.findUnique({
      where: { telegramUserId: ctx.from!.id },
    });
    const token = await generateAccountOneTimeToken(account!.id);
    return ctx.reply(
      `[Settings](${process.env.BASE_SERVER_URL}/account?token=${token})`,
      { parse_mode: "MarkdownV2" }
    );
  });

  bot.command("usage", async (ctx) => {
    logger.info(`Received /usage from ${ctx.from?.id}`);
    const account = await prisma.account.findUnique({
      where: { telegramUserId: ctx.from!.id },
    });
    const isPremium = account?.subscriptionStatus === "active";
    return ctx.reply(
      `Your current subscription status: ${isPremium ? "Active ✅" : "Inactive ❌"}\\. View your usage details and manage your subscription [here](${process.env.BASE_SERVER_URL}/account?token=${await generateAccountOneTimeToken(
        account!.id
      )})\\.`,
      { parse_mode: "MarkdownV2" }
    );
  });

  bot.command("subscription", async (ctx) => {
    logger.info(`Received /subscription from ${ctx.from?.id}`);
    const account = await prisma.account.findUnique({
      where: { telegramUserId: ctx.from!.id },
    });
    const token = await generateAccountOneTimeToken(account!.id);
    return ctx.reply(
      `Current subscription status: ${account?.subscriptionStatus === "active" ? "Active ✅" : "Inactive ❌"}\n\nManage your subscription [here](${process.env.BASE_SERVER_URL}/telegram/subscription?token=${token})\\.`,
      { parse_mode: "MarkdownV2" }
    );
  });

  // bot.use(subscriptionCheck);

  bot.command("cancel", async (ctx) => {
    const telegramUserId = ctx.from?.id;

    if (!telegramUserId) {
      return ctx.reply("⚠️ No user ID found.");
    }

    const account = await prisma.account.findFirst({
      where: { telegramUserId },
    });
    if (!account) {
      return ctx.reply("⚠️ No account found.");
    }
    if (!account.stripeCustomerId) {
      return ctx.reply("⚠️ No subscription found.");
    }

    await cancelAccountSubscription(account.stripeCustomerId);

    return ctx.reply("✅ Your subscription has been canceled.");
  });

  const photoHandler = new Composer();
  photoHandler.use(subscriptionCheck);

  photoHandler.on("message:photo", async (ctx) => {
    const photos = ctx.message.photo;
    if (photos.length === 0) return;

    const account = await prisma.account.findUnique({
      where: { telegramUserId: ctx.from!.id },
    });

    const fileId = ctx.message.photo.pop()!.file_id;

    const telegramMessageId = `${ctx.chat?.id}_${ctx.message.message_id}`;

    await prisma.message.create({
      data: {
        telegramMessageId,
        telegramChatId: String(ctx.chat?.id),
        telegramChatMessageId: String(ctx.message.message_id),
        type: "photo",
        accountId: account!.id,
        role: "user",
        telegramFileId: fileId,
      },
    });

    const statusMsg = await bot.api.sendMessage(
      ctx.chat?.id,
      "Working on it\\.\\.\\.",
      {
        reply_to_message_id: ctx.message.message_id,
        parse_mode: "MarkdownV2",
      }
    );

    // 4. QUEUE THE JOB
    // We now pass the specific 'action' to the worker
    await graphileWorker.addJob(
      "analyzeImage", // Using a generic name for the task
      {
        chatId: ctx.chat?.id,
        replyToMessageId: ctx.message.message_id,
        // @ts-ignore
        statusMessageId: statusMsg.message_id,
        fileId: fileId,
      }
    );
  });

  const refinementHandler = new Composer();
  refinementHandler.use(subscriptionCheck);

  refinementHandler.callbackQuery(/^refine_(.+)$/, async (ctx) => {
    const refineType = ctx.match[1];

    // 1. Get the message the user wants to refine (The bot's previous answer)
    const botMessage = ctx.callbackQuery.message;
    if (!botMessage) return;

    const telegramMessageId = `${ctx.chat?.id}_${botMessage.message_id}`;

    // 2. Find the context for THIS specific message
    const originalMessage = await prisma.message.findUnique({
      where: {
        telegramMessageId,
      },
    });

    if (!originalMessage) {
      await ctx.answerCallbackQuery({
        text: "Context expired. Please upload image again.",
      });
      return;
    }

    await ctx.answerCallbackQuery({
      text: `Generating ${refineType} version...`,
    });

    await graphileWorker.addJob("processMessageRefinement", {
      chatId: ctx.chat?.id,
      replyToMessageId: botMessage.message_id,
      fileId: originalMessage.telegramFileId,
      originalMessageId: originalMessage.id,
      refineType: refineType,
    });
  });

  const replyHandler = new Composer();
  replyHandler.use(subscriptionCheck);

  replyHandler.on("message:text", async (ctx, next) => {
    const reply = ctx.message.reply_to_message;
    if (reply) return next();

    const account = await prisma.account.findUnique({
      where: { telegramUserId: ctx.from!.id },
    });

    const telegramMessageId = `${ctx.chat?.id}_${ctx.message.message_id}`;

    await prisma.message.create({
      data: {
        telegramMessageId,
        telegramChatId: String(ctx.chat?.id),
        telegramChatMessageId: String(ctx.message.message_id),
        type: "text",
        text: ctx.message.text,
        accountId: account!.id,
        role: "user",
      },
    });

    const statusMsg = await bot.api.sendMessage(
      ctx.chat?.id,
      "Working on it\\.\\.\\.",
      {
        reply_to_message_id: ctx.message.message_id,
        parse_mode: "MarkdownV2",
      }
    );

    await graphileWorker.addJob(
      "analyzeText", // Using a generic name for the task
      {
        chatId: ctx.chat?.id,
        replyToMessageId: ctx.message.message_id,
        // @ts-ignore
        statusMessageId: statusMsg.message_id,
      }
    );
  });

  bot.use(refinementHandler);
  bot.use(photoHandler);
  bot.use(replyHandler);

  return bot;
}

export function escapeCaption(caption: string) {
  return caption
    .replace(/_/g, "\\_")
    .replace(/\*/g, "\\*")
    .replace(/\[/g, "\\[")
    .replace(/]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/~/g, "\\~")
    .replace(/`/g, "\\`")
    .replace(/>/g, "\\>")
    .replace(/#/g, "\\#")
    .replace(/\+/g, "\\+")
    .replace(/-/g, "\\-")
    .replace(/=/g, "\\=")
    .replace(/\|/g, "\\|")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/\./g, "\\.")
    .replace(/!/g, "\\!");
}
