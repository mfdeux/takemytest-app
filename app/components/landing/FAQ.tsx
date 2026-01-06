import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";

const faqs = [
  {
    question: "How does TakeMyTest work?",
    answer:
      "TakeMyTest uses advanced AI to analyze test questions from images you upload. Simply snap a photo of your question via Telegram, and our AI provides accurate answers with detailed explanations.",
  },
  {
    question: "What subjects does it support?",
    answer:
      "We support all major subjects including Math, Science, History, Languages, Social Studies, and more. From basic arithmetic to advanced calculus, we've got you covered.",
  },
  {
    question: "Is my data private?",
    answer:
      "Yes. We process questions in real-time and don't store your images or answers permanently. Your academic integrity and privacy are our top priorities.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. There are no contracts. Cancel your Premium subscription anytime and keep access until the end of your billing period.",
  },
  {
    question: "How accurate are the answers?",
    answer:
      "Our AI maintains a 98% accuracy rate across all subjects. We provide step-by-step explanations so you can verify the logic and learn from each solution.",
  },
  {
    question: "How do I upgrade?",
    answer:
      "Go to your account page. You'll be guided through a quick, secure payment process.",
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
