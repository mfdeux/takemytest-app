import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

interface NavbarProps {
  telegramLink: string;
}

const Navbar = ({ telegramLink }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md gradient-brand" />
            <span className="text-lg font-semibold tracking-tight">
              TakeMyTest
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary/50"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:block">
            <Link to="/solve" rel="noopener noreferrer">
              <Button
                size="sm"
                className="h-8 px-4 text-sm font-medium bg-foreground text-background hover:bg-foreground/90"
              >
                Start For Free
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 -mr-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary/50"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link to="/solve" rel="noopener noreferrer" className="mt-2">
                <Button className="w-full bg-foreground text-background hover:bg-foreground/90">
                  Answer Your Question
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
