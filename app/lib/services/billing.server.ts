import Stripe from "stripe";
import prisma from "../utils/prisma.server";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export async function cancelAccountSubscription(stripeId: string) {
  const subscriptions = await stripe.subscriptions.list({ customer: stripeId });
  for (const subscription of subscriptions.data) {
    if (subscription.status === "active") {
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      });
      console.log(
        `Subscription ${subscription.id} will be canceled at the end of the period.`
      );
    }
  }
}

export async function createBillingPortalSession({
  account,
}: {
  account: any;
}) {
  let stripeCustomerId: string | undefined;
  if (!account.stripeCustomerId) {
    const customer = await stripe.customers.create({
      metadata: {
        accountId: account.id,
        telegramUserId: account.telegramUserId.toString(),
      },
    });
    stripeCustomerId = customer.id;
    await prisma.account.update({
      where: {
        id: account.id,
      },
      data: {
        stripeCustomerId: customer.id,
      },
    });
  } else {
    stripeCustomerId = account.stripeCustomerId;
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId!,
    return_url: `${process.env.BASE_SERVER_URL}/account`,
  });
  return session.url;
}

export async function getStripeSubscriptionSession({
  account,
}: {
  account: any;
}) {
  let stripeCustomerId: string | undefined;
  if (!account.stripeCustomerId) {
    const customer = await stripe.customers.create({
      metadata: {
        accountId: account.id,
        telegramUserId: account.telegramUserId.toString(),
      },
    });
    stripeCustomerId = customer.id;
    await prisma.account.update({
      where: {
        id: account.id,
      },
      data: {
        stripeCustomerId,
      },
    });
  } else {
    stripeCustomerId = account.stripeCustomerId;
  }
  const session: Stripe.Checkout.Session =
    await stripe.checkout.sessions.create({
      line_items: [
        {
          price: process.env.DEFAULT_SUBSCRIPTION_PRICE_ID as string,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.BASE_SERVER_URL}/account?subscription_success=true`,
      cancel_url: `${process.env.BASE_SERVER_URL}/account?subscription_canceled=true`,
      automatic_tax: { enabled: false },
      customer_update: {
        address: "auto",
      },
      allow_promotion_codes: true,
      customer: stripeCustomerId,
    });

  return {
    sessionUrl: session.url,
    sessionId: session.id,
  };
}
