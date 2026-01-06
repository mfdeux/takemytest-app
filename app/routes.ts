import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/api/telegram/auth", "routes/api.telegram.auth.tsx"),
  route("/api/telegram/webhook", "routes/api.telegram.webhook.tsx"),
  route("/telegram/subscription", "routes/telegram.subscription.tsx"),
  route("/telegram/join", "routes/telegram.join.tsx"),
  route("/stripe/webhook", "routes/stripe.webhook.tsx"),
  route("/legal/terms", "routes/legal.terms.tsx"),
  route("/legal/privacy", "routes/legal.privacy.tsx"),
  route("/account", "routes/account.tsx"),
  route("/account/logout", "routes/account.logout.tsx"),
  route("/login/google", "routes/login.google.tsx"),
  route("/login/google/callback", "routes/login.google.callback.tsx"),
  route("/login/apple", "routes/login.apple.tsx"),
  route("/login/apple/callback/:state?", "routes/login.apple.callback.tsx"),
  route("/login", "routes/login.tsx"),
  route("/solve", "routes/generate.tsx"),
  route("/rpc/*", "./routes/rpc.$.ts"),
] satisfies RouteConfig;
