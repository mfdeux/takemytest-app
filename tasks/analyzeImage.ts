// worker/tasks/process_image.ts
import { Bot } from "grammy";
import { type Task } from "graphile-worker";
import {
  generateConversationReplies,
  generateConversationStarters,
  generateDateIdeas,
  generatePickUpLines,
} from "~/lib/services/ai.server";
import { escapeCaption, getBot } from "~/lib/services/telegram.server";
import prisma from "~/lib/utils/prisma.server";

interface TaskPayload {
  chatId: number;
  replyToMessageId: number;
  statusMessageId?: number;
  fileId: string;
  action: string;
}

import { InlineKeyboard } from "grammy";

export const refinementMenu = new InlineKeyboard()
  .text("➕ Longer", "refine_longer")
  .text("➖ Shorter", "refine_shorter")
  .row()
  .text("🎨 More Spicy", "refine_more_spicy")
  .text("😐 Less Spicy", "refine_less_spicy");

// Helper to prevent message ordering issues
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withChatAction<T>(
  bot: Bot<any>,
  chatId: number,
  action: "typing" | "upload_photo" | "find_location",
  task: () => Promise<T>
): Promise<T> {
  // 1. Start the loop
  const interval = setInterval(() => {
    bot.api.sendChatAction(chatId, action).catch((err) => {
      console.error("Failed to send chat action:", err);
    });
  }, 4000); // Send every 4 seconds (Telegram timeout is ~5s)

  // 2. Send immediately so there is no initial delay
  await bot.api.sendChatAction(chatId, action).catch(() => {});

  try {
    // 3. Run the actual heavy task (LLM)
    return await task();
  } catch (error) {
    throw error;
  } finally {
    clearInterval(interval);
  }
}

const task: Task = async (payload, helpers) => {
  const data = payload as TaskPayload;
  const bot = await getBot();

  const originalMessage = await prisma.message.findUnique({
    where: { telegramMessageId: data.replyToMessageId },
    include: { account: true },
  });
  if (originalMessage) {
    helpers.logger.info(
      `Processing image task for account ${originalMessage.accountId}, message ${originalMessage.id}`
    );
  } else {
    helpers.logger.info(
      `Processing image task for unknown account, telegram message ID ${data.replyToMessageId}`
    );
  }

  await withChatAction(bot, data.chatId, "typing", async () => {
    try {
      const file = await bot.api.getFile(data.fileId);
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

      const res = await fetch(fileUrl);
      if (!res.ok) {
        throw new Error(
          `Failed to fetch file from Telegram: ${res.status} ${res.statusText}`
        );
      }
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Data = buffer.toString("base64");
      const base64Image = `data:image/jpeg;base64,${base64Data}`;

      helpers.logger.debug(
        `Downloaded image and converted to base64 (length=${base64Data.length})`
      );

      helpers.logger.info(
        `Processing image for chat ${data.chatId} from file URL: ${fileUrl} with action: ${data.action}`
      );
      switch (data.action) {
        case "pickup_lines":
          let { output: pickupLines, usage: pickupLineUsage } =
            await generatePickUpLines({
              imageUrl: base64Image,
            });

          for (const line of pickupLines) {
            const formattedLine = `${line.line}`;
            const message = await bot.api.sendMessage(
              data.chatId,
              escapeCaption(formattedLine),
              {
                parse_mode: "MarkdownV2",
                reply_to_message_id: data.replyToMessageId,
                reply_markup: refinementMenu,
              }
            );
            await Promise.all([
              prisma.message.create({
                data: {
                  telegramMessageId: BigInt(message.message_id),
                  accountId: originalMessage?.accountId as string,
                  text: formattedLine,
                  type: "text",
                  replyToId: originalMessage?.id as string,
                  role: "assistant",
                  action: data.action,
                },
              }),
              prisma.tokenUsage.create({
                data: {
                  accountId: originalMessage?.accountId as string,
                  model: "x-ai/grok-4-fast",
                  inputTokens: pickupLineUsage.inputTokens,
                  outputTokens: pickupLineUsage.outputTokens,
                  totalTokens: pickupLineUsage.totalTokens,
                },
              }),
              prisma.account.update({
                where: { id: originalMessage?.accountId as string },
                data: {
                  messagesRemaining: {
                    decrement: 1,
                  },
                },
              }),
            ]);
            await wait(300);
          }
          break;
        case "convo_starters":
          let { output: convoStarters, usage: convoStarterUsage } =
            await generateConversationStarters({
              imageUrl: base64Image,
            });

          for (const line of convoStarters) {
            const formattedLine = `${line.line}`;
            const message = await bot.api.sendMessage(
              data.chatId,
              escapeCaption(formattedLine),
              {
                parse_mode: "MarkdownV2",
                reply_to_message_id: data.replyToMessageId,
              }
            );
            await Promise.all([
              prisma.message.create({
                data: {
                  telegramMessageId: BigInt(message.message_id),
                  accountId: originalMessage?.accountId as string,
                  text: formattedLine,
                  type: "text",
                  replyToId: originalMessage?.id as string,
                  role: "assistant",
                  action: data.action,
                },
              }),
              prisma.tokenUsage.create({
                data: {
                  accountId: originalMessage?.accountId as string,
                  model: "x-ai/grok-4-fast",
                  inputTokens: convoStarterUsage.inputTokens,
                  outputTokens: convoStarterUsage.outputTokens,
                  totalTokens: convoStarterUsage.totalTokens,
                },
              }),
              prisma.account.update({
                where: { id: originalMessage?.accountId as string },
                data: {
                  messagesRemaining: {
                    decrement: 1,
                  },
                },
              }),
            ]);
            await wait(300);
          }
          break;
        case "convo_replies":
          let { output: convoReplies, usage: convoReplyUsage } =
            await generateConversationReplies({
              imageUrl: base64Image,
            });

          for (const line of convoReplies) {
            const formattedLine = `${line.response}`;
            const message = await bot.api.sendMessage(
              data.chatId,
              escapeCaption(formattedLine),
              {
                parse_mode: "MarkdownV2",
                reply_to_message_id: data.replyToMessageId,
              }
            );
            await Promise.all([
              prisma.message.create({
                data: {
                  telegramMessageId: BigInt(message.message_id),
                  accountId: originalMessage?.accountId as string,
                  text: formattedLine,
                  type: "text",
                  replyToId: originalMessage?.id as string,
                  role: "assistant",
                  action: data.action,
                },
              }),
              prisma.tokenUsage.create({
                data: {
                  accountId: originalMessage?.accountId as string,
                  model: "x-ai/grok-4-fast",
                  inputTokens: convoReplyUsage.inputTokens,
                  outputTokens: convoReplyUsage.outputTokens,
                  totalTokens: convoReplyUsage.totalTokens,
                },
              }),
              prisma.account.update({
                where: { id: originalMessage?.accountId as string },
                data: {
                  messagesRemaining: {
                    decrement: 1,
                  },
                },
              }),
            ]);
            await wait(300);
          }
          break;
        case "date_ideas":
          let { output: dateIdeas, usage: dateIdeaUsage } =
            await generateDateIdeas({
              imageUrl: base64Image,
            });

          for (const line of dateIdeas) {
            const formattedLine = `${line.description}`;
            const message = await bot.api.sendMessage(
              data.chatId,
              escapeCaption(formattedLine),
              {
                parse_mode: "MarkdownV2",
                reply_to_message_id: data.replyToMessageId,
              }
            );
            await Promise.all([
              prisma.message.create({
                data: {
                  telegramMessageId: BigInt(message.message_id),
                  accountId: originalMessage?.accountId as string,
                  text: formattedLine,
                  type: "text",
                  replyToId: originalMessage?.id as string,
                  role: "assistant",
                  action: data.action,
                },
              }),
              prisma.tokenUsage.create({
                data: {
                  accountId: originalMessage?.accountId as string,
                  model: "x-ai/grok-4-fast",
                  inputTokens: dateIdeaUsage.inputTokens,
                  outputTokens: dateIdeaUsage.outputTokens,
                  totalTokens: dateIdeaUsage.totalTokens,
                },
              }),
              prisma.account.update({
                where: { id: originalMessage?.accountId as string },
                data: {
                  messagesRemaining: {
                    decrement: 1,
                  },
                },
              }),
            ]);
            await wait(300);
          }
          break;
        default:
          throw new Error(`Unknown action: ${data.action}`);
      }
      if (data.statusMessageId) {
        await bot.api.deleteMessage(data.chatId, data.statusMessageId);
      }
    } catch (error) {
      await bot.api.sendMessage(
        data.chatId,
        "⚠️ Sorry, unable to process image."
      );
      throw error;
    }
  });
};

export default task;
