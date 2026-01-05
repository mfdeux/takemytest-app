// worker/tasks/process_image.ts
import { Bot } from "grammy";
import { type Task } from "graphile-worker";
import { analyzeTestQuestionImage_Quick } from "~/lib/services/ai.server";
import { escapeCaption, getBot } from "~/lib/services/telegram.server";
import prisma from "~/lib/utils/prisma.server";

interface TaskPayload {
  chatId: number;
  replyToMessageId: number;
  statusMessageId?: number;
  fileId: string;
}

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

  const telegramMessageId = `${data.chatId}_${data.replyToMessageId}`;

  const originalMessage = await prisma.message.findUnique({
    where: { telegramMessageId },
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
        `Processing image for chat ${data.chatId} from file URL: ${fileUrl}`
      );
      const { output: analysis, usage } = await analyzeTestQuestionImage_Quick({
        imageUrl: base64Image,
      });

      helpers.logger.info(
        `Analysis complete for chat ${data.chatId}: ${JSON.stringify(analysis)}`
      );

      if (analysis.classification === "not_a_question") {
        const message = await bot.api.sendMessage(
          data.chatId,
          "❗️ The image does not appear to contain a valid test question\\. Please try again with a different image\\.",
          {
            reply_to_message_id: data.replyToMessageId,
            parse_mode: "MarkdownV2",
          }
        );
        return;
      }
      const messageText = `*Answer: ${analysis.answer.type === "single" ? escapeCaption(analysis.answer.selected[0] as string) : analysis.answer.type === "multi" ? escapeCaption(analysis.answer.selected.join(", ")) : analysis.answer.type === "boolean" ? String(analysis.answer.boolean_answer) : analysis.answer.type === "numeric" ? String(analysis.answer.numeric_answer) : analysis.answer.short_answer}*\n\n_Explanation: ${escapeCaption(analysis.justification)}_`;
      // helpers.logger.info(`Analysis details: ${JSON.stringify(analysis)}`);
      const message = await bot.api.sendMessage(data.chatId, messageText, {
        parse_mode: "MarkdownV2",
        reply_to_message_id: data.replyToMessageId,
      });
      await Promise.all([
        prisma.message.create({
          data: {
            telegramMessageId: `${data.chatId}_${message.message_id}`,
            telegramChatId: String(data.chatId),
            telegramChatMessageId: String(message.message_id),
            accountId: originalMessage?.accountId as string,
            text: messageText,
            type: "text",
            replyToId: originalMessage?.id as string,
            role: "assistant",
            aiModel: "google/gemini-2.5-flash",
            aiAnalysis: analysis,
          },
        }),
        prisma.tokenUsage.create({
          data: {
            accountId: originalMessage?.accountId as string,
            model: "google/gemini-2.5-flash",
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            totalTokens: usage.totalTokens,
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
