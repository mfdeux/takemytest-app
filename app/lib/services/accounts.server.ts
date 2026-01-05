import jsonwebtoken from "jsonwebtoken";
import prisma from "../utils/prisma.server";
import { stripe } from "./billing.server";

interface JwtPayload {
  accountId: string;
  exp?: number;
}

export function createAuthenticationToken({
  accountId,
}: {
  accountId: string;
}): string {
  const expirationDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

  const token = jsonwebtoken.sign(
    {
      accountId,
      exp: expirationDate,
    },
    process.env.SECRET_KEY as string
  );

  return token;
}

export function validateAuthenticationToken({
  token,
}: {
  token: string;
}): string | null {
  try {
    // Decode the token
    const decoded = jsonwebtoken.verify(
      token,
      process.env.SECRET_KEY as string
    ) as JwtPayload;
    return decoded.accountId;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export const getCookies = (request: Request) => {
  const cookies = request.headers.get("Cookie") as string;
  if (!cookies) return {};
  return cookies
    .split(";")
    .map((v) => v.split("="))
    .reduce(
      (acc, v) => {
        acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
        return acc;
      },
      {} as Record<string, string>
    );
};

export const deleteAccount = async ({ account }: { account: any }) => {
  return prisma.account.update({
    where: { id: account.id },
    data: { deletedAt: new Date() },
  });
};

export async function maybeAccount(request: Request) {
  const cookies = getCookies(request);
  if (!cookies[process.env.SESSION_COOKIE_KEY as string]) {
    return;
  }
  const accountId = validateAuthenticationToken({
    token: cookies[process.env.SESSION_COOKIE_KEY as string],
  });
  if (!accountId) {
    return;
  }
  const account = await prisma.account.findFirst({
    where: { id: accountId },
    select: {
      id: true,
      createdAt: true,
      telegramFirstName: true,
      telegramLastName: true,
      telegramUsername: true,
      telegramUserId: true,
      telegramLanguageCode: true,
      telegramIsPremium: true,
      messagesRemaining: true,
      messagesTotal: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionStatus: true,
      roles: true,
      defaultTone: true,
    },
  });
  return account || undefined;
}

export async function getOrCreateAccount({
  telegramUserId,
  telegramFirstName,
  telegramLastName,
  telegramUsername,
  telegramLanguageCode,
  telegramIsPremium,
}: {
  telegramUserId: number;
  telegramFirstName: string;
  telegramLastName: string;
  telegramUsername: string;
  telegramLanguageCode: string;
  telegramIsPremium: boolean;
}) {
  let account = await prisma.account.findUnique({
    where: { telegramUserId },
  });

  if (!account) {
    account = await prisma.account.create({
      data: {
        telegramUserId,
        telegramFirstName,
        telegramLastName,
        telegramUsername,
        telegramLanguageCode,
        telegramIsPremium,
        messagesRemaining: 50,
        messagesTotal: 50,
      },
    });
    const customer = await stripe.customers.create({
      metadata: {
        accountId: account.id,
        telegramUserId: account.telegramUserId.toString(),
      },
    });
    await prisma.account.update({
      where: { id: account.id },
      data: { stripeCustomerId: customer.id },
    });
  }

  return account;
}

export async function generateAccountOneTimeToken(accountId: string) {
  const token = jsonwebtoken.sign(
    {
      accountId,
    },
    process.env.SECRET_KEY!,
    {
      expiresIn: "365d",
    }
  );
  return token;
}

export async function getAccountByOneTimeToken(token: string) {
  const accountToken = jsonwebtoken.verify(token, process.env.SECRET_KEY!) as {
    accountId: string;
  };
  const account = await prisma.account.findUnique({
    where: { id: accountToken.accountId },
    select: {
      id: true,
      createdAt: true,
      telegramFirstName: true,
      telegramLastName: true,
      telegramUsername: true,
      telegramUserId: true,
      telegramLanguageCode: true,
      telegramIsPremium: true,
      messagesRemaining: true,
      messagesTotal: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionStatus: true,
      roles: true,
      defaultTone: true,
    },
  });

  if (!accountToken) {
    return undefined;
  }

  return account;
}
