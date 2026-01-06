import { redirect } from "react-router";
import { getAppleAuthUrl } from "~/lib/services/accounts.server";
import type { Route } from "./+types/login.apple";

// Triggered when your frontend <Form> submits here
export async function loader({ request }: Route.ActionArgs) {
  const url = getAppleAuthUrl();
  console.log(url);
  return redirect(url);
}
