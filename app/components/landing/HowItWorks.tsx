const steps = [
  {
    step: "01",
    title: "Open Telegram",
    description:
      "Message the TakeMyTest bot. No signup required, start instantly.",
  },
  {
    step: "02",
    title: "Snap Your Question",
    description:
      "Take a photo of any test question—math, science, history, or any subject.",
  },
  {
    step: "03",
    title: "Get Your Answer",
    description:
      "Receive accurate answers with step-by-step explanations in seconds.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 px-4 relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-brand mb-3 tracking-wide uppercase">
            How It Works
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Three simple steps
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            From confused to confident in seconds
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-12 left-8 right-8 h-px bg-gradient-to-r from-transparent via-border to-transparent hidden md:block" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.step}
                className="relative text-center md:text-left"
              >
                {/* Step number */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-border bg-background mb-6 relative z-10">
                  <span className="text-2xl font-bold text-gradient">
                    {step.step}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-2 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
