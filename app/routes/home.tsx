import ChatMockup from "~/components/landing/ChatMockup";
import FAQ from "~/components/landing/FAQ";
import Features from "~/components/landing/Features";
import Footer from "~/components/landing/Footer";
import Hero from "~/components/landing/Hero";
import HowItWorks from "~/components/landing/HowItWorks";
import Navbar from "~/components/landing/Navbar";
import Pricing from "~/components/landing/Pricing";
import type { Route } from "./+types/home";

export function loader({ request }: Route.LoaderArgs) {
  return {};
}

const TELEGRAM_BOT_LINK = "https://gettakemytest.com/telegram/join";

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar telegramLink={TELEGRAM_BOT_LINK} />
      <Hero telegramLink={TELEGRAM_BOT_LINK} />
      <Features />
      <HowItWorks />
      <ChatMockup />
      <Pricing telegramLink={TELEGRAM_BOT_LINK} />
      <FAQ />
      <Footer telegramLink={TELEGRAM_BOT_LINK} />
    </main>
  );
}
