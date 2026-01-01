import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

interface FooterProps {
  telegramLink: string;
}

const Footer = ({ telegramLink }: FooterProps) => {
  return (
    <footer className="relative">
      {/* CTA Section */}
      <div className="py-24 px-4 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/50 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Ready to ace your
            <br />
            <span className="text-gradient">next test?</span>
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join thousands of students who study smarter with AI.
          </p>
          <a href={telegramLink} target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              className="h-12 px-8 text-base font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Free on Telegram
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </div>

      {/* Footer bottom */}
      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md gradient-brand" />
              <span className="text-lg font-semibold tracking-tight">
                TakeMyTest
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link
                to="/legal/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/legal/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
            </div>

            {/* Copyright */}
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} TakeMyTest
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
