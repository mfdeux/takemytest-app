import { Check, Sparkles } from "lucide-react";
import { Button } from "~/components/ui/button";

interface PricingProps {
  telegramLink: string;
}

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "Try Linecraft risk-free",
    features: [
      "20 messages per month",
      "All 4 conversation tools",
      "Instant AI responses",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "$4.99",
    period: "/month",
    description: "For the confident conversationalist",
    features: [
      "Unlimited messages",
      "All 4 conversation tools",
      "Priority AI responses",
      "Advanced personalization",
      "Exclusive styles",
      "Cancel anytime",
    ],
    cta: "Go Premium",
    highlighted: true,
  },
];

const Pricing = ({ telegramLink }: PricingProps) => {
  return (
    <section id="pricing" className="py-24 px-4 relative">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-brand mb-3 tracking-wide uppercase">
            Pricing
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Simple pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Start free, upgrade when you're ready
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-2xl border transition-all duration-300 ${
                plan.highlighted
                  ? "bg-card border-brand/50 shadow-[0_0_60px_-12px_hsl(262_83%_58%_/_0.3)]"
                  : "bg-card border-border hover:border-muted-foreground/30"
              }`}
            >
              {/* Popular badge */}
              {plan.highlighted && (
                <div className="absolute -top-3 left-6">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand text-xs font-medium text-brand-foreground">
                    <Sparkles className="w-3 h-3" />
                    Popular
                  </div>
                </div>
              )}

              {/* Plan name */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className="text-5xl font-bold tracking-tight">
                  {plan.price}
                </span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        plan.highlighted ? "bg-brand/20" : "bg-secondary"
                      }`}
                    >
                      <Check
                        className={`w-3 h-3 ${plan.highlighted ? "text-brand" : "text-muted-foreground"}`}
                      />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button
                  variant={plan.highlighted ? "default" : "secondary"}
                  className={`w-full h-11 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    plan.highlighted
                      ? "bg-brand text-brand-foreground hover:bg-brand/90"
                      : ""
                  }`}
                >
                  {plan.cta}
                </Button>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
