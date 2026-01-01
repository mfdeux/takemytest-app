// worker/tasks/process_followup_question.ts
import { type Task } from "graphile-worker";
import {
  generateConversationReplies,
  generateConversationStarters,
  generateDateIdeas,
  generatePickUpLines,
} from "~/lib/services/ai.server";
import { escapeCaption, getBot } from "~/lib/services/telegram.server";
import prisma from "~/lib/utils/prisma.server";

// Helper to prevent message ordering issues
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

import { InlineKeyboard } from "grammy";

export const refinementMenu = new InlineKeyboard()
  .text("➕ Longer", "refine_longer")
  .text("➖ Shorter", "refine_shorter")
  .row()
  .text("🎨 More Spicy", "refine_more_spicy")
  .text("😐 Less Spicy", "refine_less_spicy");

interface TaskPayload {
  chatId: number;
  replyToMessageId: number;
  fileId: string;
  originalMessageId: string;
  refineType: string;
}

const task: Task = async (payload, helpers) => {
  const data = payload as TaskPayload;
  const bot = await getBot();

  const originalMessage = await prisma.message.findUnique({
    where: { id: data.originalMessageId },
    include: {
      replyTo: true,
      account: true,
    },
  });
  if (!originalMessage) {
    helpers.logger.error("Original message not found for refinement");
    return;
  }

  const file = await bot.api.getFile(
    originalMessage.replyTo?.telegramFileId as string
  );
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
    `Processing image for chat ${data.chatId} from file URL: ${fileUrl} with action: ${originalMessage.action} and refineType: ${data.refineType}`
  );

  switch (originalMessage.action) {
    case "pickup_lines":
      const { output: pickupLines, usage: pickupLineUsage } =
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
            reply_to_message_id: originalMessage.replyTo?.telegramMessageId
              ? Number(originalMessage.replyTo.telegramMessageId)
              : undefined,
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
              replyToId: originalMessage?.replyTo?.id as string,
              refinementOfId: originalMessage.id,
              refineType: data.refineType,
              role: "assistant",
              action: originalMessage.action,
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
      const { output: convoStarters, usage: convoStarterUsage } =
        await generateConversationStarters({
          imageUrl: base64Image,
          refineType: data.refineType,
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
              replyToId: originalMessage?.replyTo?.id as string,
              refinementOfId: originalMessage.id,
              refineType: data.refineType,
              role: "assistant",
              action: originalMessage.action,
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
      const { output: convoReplies, usage: convoReplyUsage } =
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
              replyToId: originalMessage?.replyTo?.id as string,
              refinementOfId: originalMessage.id,
              refineType: data.refineType,
              role: "assistant",
              action: originalMessage.action,
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
      const { output: dateIdeas, usage: dateIdeaUsage } =
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
              replyToId: originalMessage?.replyTo?.id as string,
              refinementOfId: originalMessage.id,
              refineType: data.refineType,
              role: "assistant",
              action: originalMessage.action,
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
      throw new Error(`Unknown action: ${originalMessage.action}`);
  }
};

export default task;
