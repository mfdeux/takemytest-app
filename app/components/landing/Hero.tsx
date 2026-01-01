import { ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";

interface HeroProps {
  telegramLink: string;
}

const Hero = ({ telegramLink }: HeroProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-24 pb-20">
      {/* Grid background */}
      <div className="absolute inset-0 grid-pattern opacity-40" />

      {/* Gradient orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-brand/20 via-blue-500/10 to-cyan-500/10 blur-3xl" />

      {/* Noise texture */}
      <div className="absolute inset-0 noise pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Main headline */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 opacity-0 animate-fade-up"
          style={{ animationDelay: "0s" }}
        >
          Ace every
          <br />
          <span className="text-gradient">test.</span>
        </h1>

        {/* Subheadline */}
        <p
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed opacity-0 animate-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          Snap a photo of any test question. Get instant answers and detailed explanations—all through Telegram.
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center opacity-0 animate-fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          <a href={telegramLink} target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              className="h-12 px-6 text-base font-semibold bg-white text-black hover:bg-white/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start for Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>
          <a href="#how-it-works">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-6 text-base border-border bg-transparent hover:bg-secondary"
            >
              See How It Works
            </Button>
          </a>
        </div>

        {/* Stats */}
        <div
          className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold">50K+</div>
            <div className="text-sm text-muted-foreground">Questions Solved</div>
          </div>
          <div className="w-px h-10 bg-border hidden md:block" />
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold">15K+</div>
            <div className="text-sm text-muted-foreground">Active Students</div>
          </div>
          <div className="w-px h-10 bg-border hidden md:block" />
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold">98%</div>
            <div className="text-sm text-muted-foreground">Accuracy Rate</div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
