import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";

const faqs = [
  {
    question: "How does Linecraft work?",
    answer:
      "Linecraft uses advanced AI to generate personalized pickup lines, conversation starters, reply suggestions, and date ideas. Simply describe your situation to the bot, and it crafts the perfect response.",
  },
  {
    question: "Is my data private?",
    answer:
      "Absolutely. We don't store your conversations or personal data. Your interactions are processed in real-time and not saved.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. There are no contracts. Cancel your Premium subscription anytime and keep access until the end of your billing period.",
  },
  {
    question: "What makes this different from ChatGPT?",
    answer:
      "Linecraft is purpose-built for dating and social conversations. It understands context, tone, and timing in ways general AI doesn't—plus it's right in Telegram.",
  },
  {
    question: "Do the pickup lines work?",
    answer:
      "Our AI generates clever, contextual lines—not cheesy scripts. The key is authenticity: use them as inspiration and adapt to your personality.",
  },
  {
    question: "How do I upgrade?",
    answer:
      "Start a chat with Linecraft on Telegram and use the /upgrade command. You'll be guided through a quick, secure payment process.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="py-24 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-brand mb-3 tracking-wide uppercase">
            FAQ
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Questions?
          </h2>
        </div>

        {/* FAQ accordion */}
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border rounded-lg px-5 data-[state=open]:bg-secondary/30 transition-colors"
            >
              <AccordionTrigger className="text-left font-medium hover:no-underline py-4 text-sm md:text-base">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4 leading-relaxed text-sm">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
