import axios from "axios";
import jsonwebtoken from "jsonwebtoken";
import { stringify } from "node:querystring";
import { redirect } from "react-router";
import prisma from "../utils/prisma.server";
import { json } from "../utils/utils.server";
import { stripe } from "./billing.server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL!;

const CONFIG = {
  clientID: process.env.APPLE_CLIENT_ID!,
  teamID: process.env.APPLE_TEAM_ID!,
  keyID: process.env.APPLE_KEY_ID!,
  privateKey: process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  callbackURL: process.env.APPLE_CALLBACK_URL!,
};

// 1. Generate the URL to send the user to Apple
export function getAppleAuthUrl() {
  const url = new URL("https://appleid.apple.com/auth/authorize");

  // "form_post" is required for Apple to send the 'user' object (name)
  url.searchParams.set("response_type", "code id_token");
  url.searchParams.set("response_mode", "form_post");
  url.searchParams.set("client_id", CONFIG.clientID);
  url.searchParams.set("redirect_uri", CONFIG.callbackURL);
  url.searchParams.set("scope", "name email");
  url.searchParams.set("state", Math.random().toString(36).substring(7)); // CSRF protection

  return url.toString();
}

// 2. Generate Client Secret (JWT signed with your .p8 key)
// Apple requires this to prove you are the developer when verifying codes
function generateClientSecret() {
  const header = { alg: "ES256", kid: CONFIG.keyID };
  const payload = {
    iss: CONFIG.teamID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15777000, // 6 months
    aud: "https://appleid.apple.com",
    sub: CONFIG.clientID,
  };

  return jsonwebtoken.sign(payload, CONFIG.privateKey, {
    algorithm: "ES256",
    header,
  });
}

// 3. Verify the Authorization Code with Apple
// This ensures the 'code' sent back is valid and belongs to your app
export async function verifyAppleCode(code: string) {
  const clientSecret = generateClientSecret();

  const params = new URLSearchParams();
  params.append("client_id", CONFIG.clientID);
  params.append("client_secret", clientSecret);
  params.append("code", code);
  params.append("grant_type", "authorization_code");
  params.append("redirect_uri", CONFIG.callbackURL);

  const response = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    body: params,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!response.ok) {
    throw new Error("Failed to verify Apple code");
  }

  return await response.json();
}

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

export async function requireAccount(request: Request, type: string = "ui") {
  const cookies = getCookies(request);
  const cookieToken = cookies[process.env.SESSION_COOKIE_KEY as string];
  const headerToken = request.headers.get("x-api-key");

  if (!cookieToken && !headerToken) {
    if (type === "api") {
      throw json({ error: "Unauthorized" }, { status: 401 });
    }
    throw redirect(`/login?redirectTo=${new URL(request.url).pathname}`);
  }

  const accountId = validateAuthenticationToken({
    token: cookieToken || (headerToken as string),
  });

  if (!accountId) {
    if (type === "api") {
      throw json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("no account id");
    throw redirect(`/login?redirectTo=${new URL(request.url).pathname}`);
  }
  const account = await prisma.account.findFirst({
    where: { id: accountId },
    select: {
      id: true,
      createdAt: true,
      provider: true,
      providerPk: true,
      providerMetadata: true,
      emailAddress: true,
      fullName: true,
      providerImageUrl: true,
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
    },
  });
  if (!account) {
    if (type === "api") {
      throw json({ error: "Unauthorized" }, { status: 401 });
    }
    throw redirect(`/login?redirectTo=${new URL(request.url).pathname}`);
  }
  return account;
}

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
      provider: true,
      providerPk: true,
      providerMetadata: true,
      emailAddress: true,
      fullName: true,
      providerImageUrl: true,
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
        telegramUserId: account.telegramUserId
          ? account.telegramUserId.toString()
          : null,
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
    },
  });

  if (!accountToken) {
    return undefined;
  }

  return account;
}

export async function getOrCreateGoogleAccount({
  id,
  name,
  email,
  imageUrl,
  metadata,
}: {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
  metadata: any;
}) {
  const account = await prisma.account.findFirst({
    where: { provider: "google", providerPk: id },
  });
  if (!account) {
    const customer = await stripe.customers.create({
      email: email,
    });
    const newAccount = await prisma.account.create({
      data: {
        provider: "google",
        providerPk: id,
        providerMetadata: metadata,
        emailAddress: email,
        fullName: name,
        providerImageUrl: imageUrl,
        stripeCustomerId: customer.id,
        messagesRemaining: 50,
        messagesTotal: 50,
      },
      select: {
        id: true,
        fullName: true,
        emailAddress: true,
        providerImageUrl: true,
        stripeCustomerId: true,
        roles: true,
      },
    });
    return newAccount;
  }
  return account;
}

export async function getOrCreateAppleAccount({
  id,
  name,
  email,
  imageUrl,
  metadata,
}: {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
  metadata: any;
}) {
  const account = await prisma.account.findFirst({
    where: { provider: "apple", providerPk: id },
  });
  if (!account) {
    const customer = await stripe.customers.create({
      email: email,
    });
    const newAccount = await prisma.account.create({
      data: {
        provider: "apple",
        providerPk: id,
        providerMetadata: metadata,
        emailAddress: email,
        fullName: name,
        providerImageUrl: imageUrl,
        stripeCustomerId: customer.id,
        messagesRemaining: 50,
        messagesTotal: 50,
      },
      select: {
        id: true,
        fullName: true,
        emailAddress: true,
        providerImageUrl: true,
        stripeCustomerId: true,
        roles: true,
      },
    });
    return newAccount;
  }
  return account;
}

export const getGoogleAuthUrl = (state?: string) => {
  const stringifiedParams = stringify({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URL,
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ].join(" "),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    state: state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}`;
};

type GoogleOAuth2TokenResponse = {
  access_token: string; // The token that can be sent to a Google API
  token_type: string; // Identifies the type of token returned. At this time, this field always has the value Bearer
  expires_in: number; // The remaining lifetime of the access token in seconds
  refresh_token?: string; // A token that may be used to obtain a new access token. Refresh tokens are valid until the user revokes access.
  id_token?: string; // A JWT that contains identity information about the user that is digitally signed by Google.
  scope?: string; // The scopes of access granted by the access_token expressed as a list of space-delimited, case-sensitive strings.
  error?: string; // An error code (e.g., invalid_request, unauthorized_client, access_denied, unsupported_response_type, invalid_scope, server_error, temporarily_unavailable)
  error_description?: string; // Human-readable text providing additional details, used to assist the client developer in understanding the error that occurred.
  error_uri?: string; // A URI identifying a human-readable web page with information about the error, used to provide the client developer with additional information about the error.
};

export async function getGoogleAccessTokenFromCode({ code }: { code: string }) {
  const { data } = await axios({
    url: `https://oauth2.googleapis.com/token`,
    method: "post",
    data: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URL,
      grant_type: "authorization_code",
      code,
    },
  });
  return data as GoogleOAuth2TokenResponse;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export async function getGoogleUserInfo({
  accessToken,
}: {
  accessToken: string;
}) {
  const { data } = await axios({
    url: "https://www.googleapis.com/oauth2/v2/userinfo",
    method: "get",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return data as GoogleUserInfo;
}

export async function authenticateWithGoogle(code: string) {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URL,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Failed to exchange authorization code for tokens");
  }

  const tokens = await tokenResponse.json();
  const userInfoResponse = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }
  );

  if (!userInfoResponse.ok) {
    throw new Error("Failed to fetch user info");
  }

  const userInfo = await userInfoResponse.json();

  return getOrCreateGoogleAccount({
    id: userInfo.sub,
    email: userInfo.email,
    name: userInfo.name,
    imageUrl: userInfo.picture,
    metadata: userInfo,
  });
}
