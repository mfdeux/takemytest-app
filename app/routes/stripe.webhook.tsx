// app/routes/api.stripe-webhook.ts

import Stripe from "stripe";
import prisma from "~/lib/utils/prisma.server";
import { json } from "~/lib/utils/utils.server";
import type { Route } from "./+types/stripe.webhook";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export const action = async ({ request }: Route.ActionArgs) => {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    await prisma.stripeWebhookEvent.create({
      data: { data: event as any, type: event.type, stripeEventId: event.id },
    });

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const item = subscription.items.data[0];
        await prisma.account.update({
          where: { stripeCustomerId: subscription.customer as string },
          data: {
            messagesRemaining: 10000, // Reset messages remaining on subscription update
            messagesTotal: 10000,
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            subscriptionPeriodBegin: new Date(),
            subscriptionPeriodEnd: new Date(item.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
        // TODO: send email on subscribing
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const item = subscription.items.data[0];
        await prisma.account.update({
          where: { stripeCustomerId: subscription.customer as string },
          data: {
            subscriptionStatus: "canceled",
            subscriptionPeriodEnd: new Date(item.current_period_end * 1000),
            cancelAtPeriodEnd: false,
          },
        });
        break;
      }
    }

    return json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }
};
