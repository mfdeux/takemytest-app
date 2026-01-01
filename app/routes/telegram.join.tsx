import { redirect } from "react-router";
import { trackPageview } from "~/lib/utils/plausible.server";
import type { Route } from "./+types/telegram.join";

export async function loader({ request }: Route.LoaderArgs) {
  await trackPageview({ request });
  return redirect(`https://t.me/LinecraftX_Bot`);
}

export default function Page() {
  return <div>Join</div>;
}
