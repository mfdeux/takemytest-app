import prisma from "../utils/prisma.server";

import type { Account } from "generated/prisma/client";
import { Bot, Context, type NextFunction } from "grammy";

// Define the shape of your custom data
interface CustomSession {
  account: Account;
}

// Merge the default Context with your custom data
export type MyContext = Context & {
  session: CustomSession;
};

import { addDays } from "date-fns";
import { Composer, InlineKeyboard } from "grammy";
import graphileWorker from "../utils/graphile.server";
import logger from "../utils/logger.server";
import {
  generateAccountOneTimeToken,
  getOrCreateAccount,
} from "./accounts.server";
import { cancelAccountSubscription } from "./billing.server";

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
    return ctx.reply("Welcome to LinecraftX! 🚀");
  });

  bot.command("terms", (ctx) => {
    logger.info(`Received /terms from ${ctx.from?.id}`);
    return ctx.reply(
      `Visit [Terms of Service](${process.env.BASE_SERVER_URL}/legal/terms) for assistance.`,
      { parse_mode: "MarkdownV2" }
    );
  });

  bot.command("privacy", (ctx) => {
    logger.info(`Received /privacy from ${ctx.from?.id}`);
    return ctx.reply(
      `Visit [Privacy Policy](${process.env.BASE_SERVER_URL}/legal/privacy) for assistance.`,
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

    // guard against not having requests
    // guard against too much usage

    const keyboard = new InlineKeyboard()
      .text("🧐 Pickup Lines", "act_pickup_lines")
      .row()
      .text("⬆️ Convo Starters", "act_convo_starters")
      .row()
      .text("⬆️ Convo Replies", "act_convo_replies")
      .row()
      .text("⬇️ Date Ideas", "act_date_ideas");

    const account = await prisma.account.findUnique({
      where: { telegramUserId: ctx.from!.id },
    });

    const fileId = ctx.message.photo.pop()!.file_id;

    await prisma.message.create({
      data: {
        telegramMessageId: BigInt(ctx.message.message_id),
        type: "photo",
        accountId: account!.id,
        role: "user",
        telegramFileId: fileId,
      },
    });

    // Reply to the photo with the options
    await ctx.reply("Image received. What action would you like to perform?", {
      reply_markup: keyboard,
      reply_parameters: { message_id: ctx.message.message_id }, // Link reply to photo
    });
  });

  const callbackHandler = new Composer();
  callbackHandler.use(subscriptionCheck);

  // Listen for any callback data starting with "act_"
  callbackHandler.callbackQuery(/^act_(.+)$/, async (ctx) => {
    const actionStr = ctx.match[1]; // e.g., "describe", "scale_up"

    // 1. UX: Immediately acknowledge the click (stops button flashing)
    await ctx.answerCallbackQuery({
      text: `Processing: ${actionStr.replace("_", " ")}...`,
    });

    const botMessage = ctx.callbackQuery.message;
    const originalPhotoMessage = botMessage?.reply_to_message;

    // Safety check: Did the user delete the photo message in the meantime?
    if (!originalPhotoMessage || !originalPhotoMessage.photo) {
      await ctx.editMessageText(
        "⚠️ Cannot find original image. Please try again."
      );
      return;
    }

    const fileId = originalPhotoMessage.photo.pop()!.file_id;

    // 3. UX: Remove the buttons so they can't click twice
    // We edit the prompt message to show status
    const statusMsg = await ctx.editMessageText(
      `⚙️ Working on: ${actionStr}...`
    );

    // 4. QUEUE THE JOB
    // We now pass the specific 'action' to the worker
    await graphileWorker.addJob(
      "analyzeImage", // Using a generic name for the task
      {
        chatId: ctx.chat?.id,
        replyToMessageId: originalPhotoMessage.message_id,
        // @ts-ignore
        statusMessageId: statusMsg.message_id,
        fileId: fileId,
        action: actionStr, // <--- The new piece of data
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

    // 2. Find the context for THIS specific message
    const originalMessage = await prisma.message.findUnique({
      where: {
        telegramMessageId: BigInt(botMessage.message_id),
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

  // const replyHandler = new Composer();

  // replyHandler.on("message:text", async (ctx, next) => {
  //   const reply = ctx.message.reply_to_message;
  //   if (!reply) return next();

  //   const botId = ctx.me.id;
  //   if (reply.from?.id !== botId) return next();

  //   const originalMessage = await prisma.message.findUnique({
  //     where: {
  //       telegramMessageId: BigInt(reply.message_id),
  //     },
  //   });

  //   if (!originalMessage || !originalMessage.telegramFileId) {
  //     return ctx.reply(
  //       "I've lost the context for this image. Please upload it again."
  //     );
  //   }

  //   // if image, then pass in; if text, then pass in text and image

  //   await graphileWorker.addJob(
  //     "processFollowUp", // Using a generic name for the task
  //     {
  //       chatId: ctx.chat.id,
  //       replyToMessageId: ctx.message.message_id,
  //       fileId: originalMessage.telegramFileId,
  //       previousMessageId: originalMessage.id,
  //       userQuestion: ctx.message.text,
  //     }
  //   );
  // });

  bot.use(refinementHandler);
  bot.use(photoHandler);
  bot.use(callbackHandler);

  // --- Command: /remove <username> ---
  // bot.command("remove", async (ctx) => {
  //   const username = ctx.match.trim().toLowerCase();

  //   if (!username) {
  //     return ctx.reply("⚠️ Usage: /remove <instagram_username>");
  //   }

  //   const result = await prisma.profileAssociation.deleteMany({
  //     where: {
  //       accountId: ctx.session.account.id,
  //       profile: { username },
  //     },
  //   });

  //   if (result.count === 0) {
  //     return ctx.reply(`⚠️ You aren't tracking **${username}**.`, {
  //       parse_mode: "Markdown",
  //     });
  //   }

  //   return ctx.reply(`🗑️ Stopped tracking **${username}**.`, {
  //     parse_mode: "Markdown",
  //   });
  // });

  // // --- Command: /list ---
  // bot.command("list", async (ctx) => {
  //   const accounts = await prisma.profileAssociation.findMany({
  //     where: { accountId: ctx.session.account.id },
  //     orderBy: { profile: { username: "asc" } },
  //     include: { profile: true },
  //   });

  //   if (accounts.length === 0) {
  //     return ctx.reply("You are not tracking anyone yet. Use /add to start.");
  //   }

  //   const list = accounts.map((a) => `• ${a.profile.username}`).join("\n");
  //   return ctx.reply(`📋 **Your Tracked Accounts:**\n\n${list}`, {
  //     parse_mode: "Markdown",
  //   });
  // });
  return bot;
}

export function escapeCaption(caption: string) {
  // Escape characters as per Telegram MarkdownV2 requirements
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

export async function sendMessageToTelegram(
  accountId: string,
  chatId: string,
  mediaType: "image" | "video",
  mediaUrl: string,
  caption?: string
) {
  const user = await prisma.account.findUnique({ where: { id: accountId } });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const method = mediaType === "video" ? "sendVideo" : "sendPhoto";
  const mediaKey = mediaType === "video" ? "video" : "photo";

  const url = `https://api.telegram.org/bot${token}/${method}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        [mediaKey]: mediaUrl,
        caption: escapeCaption(caption || "Here is your saved story!"),
        parse_mode: "MarkdownV2",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`Telegram ${method} Error:`, err);
    }
  } catch (error) {
    console.error("Failed to send telegram message", error);
  }
}
