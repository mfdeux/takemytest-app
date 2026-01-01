import { BookOpen, Zap, GraduationCap, CheckCircle } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Answers",
    description:
      "Get accurate solutions to any test question in seconds.",
  },
  {
    icon: BookOpen,
    title: "Step-by-Step Explanations",
    description: "Understand the how and why behind every answer.",
  },
  {
    icon: GraduationCap,
    title: "All Subjects Covered",
    description: "Math, Science, History, Languages, and more.",
  },
  {
    icon: CheckCircle,
    title: "Verified Solutions",
    description: "AI-powered accuracy you can trust for better grades.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 px-4 relative">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-brand mb-3 tracking-wide uppercase">
            Features
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Study smarter, not harder
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Everything you need to ace your tests and understand the material
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-8 rounded-xl bg-card border border-border hover:border-border/80 transition-all duration-300 hover:bg-secondary/50"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-5 group-hover:bg-brand/10 transition-colors">
                <feature.icon className="w-6 h-6 text-muted-foreground group-hover:text-brand transition-colors" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-2 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
