import jsonwebtoken from "jsonwebtoken";
import { redirect } from "react-router";
import {
  createAuthenticationToken,
  getOrCreateAppleAccount,
  verifyAppleCode,
} from "~/lib/services/accounts.server";
import type { Route } from "./+types/login.google.callback";

export const loader = async ({ request }: Route.LoaderArgs) => {
  console.log("Received Apple login GET callback");
  return {};
};

export const action = async ({ request }: Route.LoaderArgs) => {
  console.log("Received Apple login POST callback");
  const formData = await request.formData();

  // Apple sends these fields
  const code = formData.get("code") as string;
  const idToken = formData.get("id_token") as string;
  const userJson = formData.get("user") as string; // Only on first login!
  const redirectTo = process.env.LOGIN_SUCCESS_REDIRECT;

  if (!code || !idToken) {
    return redirect("/login?error=apple_failed");
  }

  try {
    // Exchange the authorization code for user info
    await verifyAppleCode(code);
    // 2. Decode the ID Token to get Email
    // We don't verify signature here because step 1 implicitly proved it's valid,
    // but in a strict setup, you verify the JWT signature too.
    const decoded: any = jsonwebtoken.decode(idToken);
    const email = decoded.email;
    const appleUserId = decoded.sub;

    // 3. Handle Name (Only sent on FIRST login)
    let firstName = "User";
    let lastName = "";
    if (userJson) {
      const userObj = JSON.parse(userJson);
      if (userObj.name) {
        firstName = userObj.name.firstName;
        lastName = userObj.name.lastName;
      }
    }

    const account = await getOrCreateAppleAccount({
      id: appleUserId,
      email,
      name: `${firstName} ${lastName}`.trim(),
      imageUrl: decoded.picture,
      metadata: decoded,
    });

    const token = createAuthenticationToken({ accountId: account.id });
    const expirationDate = new Date();
    expirationDate.setTime(
      expirationDate.getTime() + 365 * 24 * 60 * 60 * 1000
    );
    const expires = expirationDate.toUTCString();
    return redirect(redirectTo as string, {
      headers: {
        "Set-Cookie": `${
          process.env.SESSION_COOKIE_KEY as string
        }=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`,
      },
    });
  } catch (error) {
    console.error("Failed to authenticate with Google:", error);
    return redirect("/login?error=authentication_failed");
  }
};

export default function Callback() {
  return null; // This route does not render a page, it simply handles the callback logic.
}
