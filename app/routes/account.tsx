import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, CreditCard, LogOut, User } from "lucide-react";
import { Link, redirect, useRevalidator } from "react-router";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { orpc } from "~/lib/orpc/orpc";
import {
  createAuthenticationToken,
  getAccountByOneTimeToken,
  maybeAccount,
} from "~/lib/services/accounts.server";
import type { Route } from "./+types/account";

export async function loader({ request }: Route.LoaderArgs) {
  let account = await maybeAccount(request);
  if (!account) {
    const searchParams = new URL(request.url).searchParams;
    const token = searchParams.get("token") || "";
    if (!token) {
      throw new Response("Unauthorized", { status: 401 });
    }
    // @ts-ignore
    account = await getAccountByOneTimeToken(token);
    if (!account) {
      throw new Response("Unauthorized", { status: 401 });
    }
    const authToken = createAuthenticationToken({ accountId: account.id });
    const expirationDate = new Date();
    expirationDate.setTime(
      expirationDate.getTime() + 365 * 24 * 60 * 60 * 1000
    );
    const expires = expirationDate.toUTCString();
    return redirect("/account", {
      headers: {
        "Set-Cookie": `${
          process.env.SESSION_COOKIE_KEY as string
        }=${authToken}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`,
      },
    });
  }
  return { account };
}

export default function Page({
  loaderData: { account },
}: Route.ComponentProps) {
  const revalidator = useRevalidator();
  const isPremium = account.subscriptionStatus === "active";
  const updateMutation = useMutation(
    orpc.account.updateAccount.mutationOptions()
  );
  const deleteMutation = useMutation(orpc.deleteAccount.mutationOptions());

  async function handleDeleteAccount() {
    await deleteMutation.mutateAsync({});
    toast.success("Account deleted");
    window.location.href = "/";
  }

  return (
    <>
      <title>Account | TakeMyTest</title>
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {account.telegramUsername ||
                  account.emailAddress ||
                  "Telegram User"}
              </h1>
              <p className="text-muted-foreground">
                Member since {format(account.createdAt, "MMMM yyyy")}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Plan & Usage */}
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <CardTitle className="text-lg">Plan & Usage</CardTitle>
                  </div>
                  <Badge variant="secondary">
                    {isPremium ? "Premium" : "Free"}
                  </Badge>
                </div>
                <CardDescription>
                  Manage your subscription and view usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isPremium ? (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Messages</span>
                    <span className="font-medium text-brand">Unlimited</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        Messages remaining
                      </span>
                      <span className="font-medium">
                        {account.messagesRemaining} / {account.messagesTotal}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-brand rounded-full transition-all"
                        style={{
                          width: `${(account.messagesRemaining / account.messagesTotal) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {!isPremium && (
                  <Button
                    onClick={() => {
                      window.location.href = "/telegram/subscription";
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    Upgrade to Premium
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Account Info</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {account.provider === "telegram"
                      ? "Telegram Username"
                      : "Email Address"}
                  </span>
                  <span className="font-medium">
                    {account.telegramUsername ||
                      account.emailAddress ||
                      "Telegram User"}
                  </span>
                </div>

                {account.provider === "telegram" && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telegram ID</span>
                      <span className="font-mono text-sm">
                        {account.telegramUserId}
                      </span>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span>{format(account.createdAt, "MMMM yyyy")}</span>
                </div>
              </CardContent>
            </Card>

            {/* --- NEW SESSION CARD (LOGOUT) --- */}
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Session</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/account/logout">Log Out</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50 bg-card">
              <CardHeader>
                <CardTitle className="text-lg text-destructive">
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50"
                  onClick={() => handleDeleteAccount()}
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
