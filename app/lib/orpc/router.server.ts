import { os } from "@orpc/server";
import * as z from "zod";

import { ORPCError } from "@orpc/server";
import type { Account } from "generated/prisma/client";

import {
  createBillingPortalSession,
  getStripeSubscriptionSession,
} from "~/lib/services/billing.server";

import { addDays } from "date-fns";
import prisma from "~/lib/utils/prisma.server";
import { deleteAccount } from "../services/accounts.server";
import { analyzeTestQuestionImage_Quick } from "../services/ai.server";

export const requiredAuthMiddleware = os
  .$context<{ account?: Account }>()
  .middleware(async ({ context, next }) => {
    const { account } = context;
    if (!account) {
      throw new ORPCError("UNAUTHORIZED");
    }
    return next({
      context: { account },
    });
  });

const subscriptionCheck = os
  .$context<{ account?: Account }>()
  .middleware(async ({ context, next }) => {
    const account = context.account;

    if (!account) {
      throw new ORPCError("UNAUTHORIZED");
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
        throw new ORPCError("UNAUTHORIZED");
      }
      return next({
        context: { account },
      });
    }

    if (account.messagesRemaining > 0) {
      // Proceed to the next middleware or handler
      return next({
        context: { account },
      });
    }
    throw new ORPCError("UNAUTHORIZED");
  });

export const router = {
  responses: {
    generateSolution: os
      .use(requiredAuthMiddleware)
      .use(subscriptionCheck)
      .input(
        z.object({
          imageUrl: z.string(),
        })
      )
      .handler(async ({ input, context }) => {
        const { output: analysis, usage } =
          await analyzeTestQuestionImage_Quick({
            imageUrl: input.imageUrl,
          });
        await Promise.all([
          prisma.tokenUsage.create({
            data: {
              accountId: context.account.id,
              model: "google/gemini-2.5-flash",
              inputTokens: usage.inputTokens,
              outputTokens: usage.outputTokens,
              totalTokens: usage.totalTokens,
            },
          }),
          prisma.account.update({
            where: { id: context.account.id },
            data: {
              messagesRemaining: {
                decrement: 1,
              },
            },
          }),
        ]);
        return analysis;
      }),
  },
  billing: {
    getStripeSubscriptionSession: os
      .use(requiredAuthMiddleware)
      .handler(async ({ input, context }) => {
        const session = await getStripeSubscriptionSession({
          account: context.account,
        });
        return { session };
      }),
    createPortalSession: os
      .use(requiredAuthMiddleware)
      .handler(async ({ context, input }) => {
        const url = await createBillingPortalSession({
          account: context.account,
        });
        return { url };
      }),
  },
  account: {
    updateAccount: os
      .use(requiredAuthMiddleware)
      .input(
        z.object({
          defaultTone: z
            .enum(["playful", "romantic", "confident", "forward", "unhinged"])
            .optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const updated = await prisma.account.update({
          where: { id: context.account.id },
          data: {
            defaultTone: input.defaultTone ?? context.account.defaultTone,
          },
        });
        return { account: updated };
      }),
  },
  deleteAccount: os.use(requiredAuthMiddleware).handler(async ({ context }) => {
    await deleteAccount({ account: context.account });
    return { success: true };
  }),
};

export type Router = typeof router;

export default router;
