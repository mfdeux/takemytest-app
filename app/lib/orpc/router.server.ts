import { os } from "@orpc/server";
import * as z from "zod";

import { ORPCError } from "@orpc/server";
import type { Account } from "generated/prisma/client";

import {
  createBillingPortalSession,
  getStripeSubscriptionSession,
} from "~/lib/services/billing.server";

import prisma from "~/lib/utils/prisma.server";
import { deleteAccount } from "../services/accounts.server";

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

export const router = {
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
