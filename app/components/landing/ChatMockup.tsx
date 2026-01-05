import { Send } from "lucide-react";

const messages = [
  {
    type: "user",
    isImage: true,
    imageLabel: "math_question.jpg",
    caption: "Need help with this biology problem!",
    imageContent: `Once the erythrocytes enter the blood in humans, it is estimated that they have an
average lifetime of how many days. Is it:\n
\na) 10 days
\nb) 120 days
\nc) 200 days
\nd) 360 days`,
  },
  {
    type: "bot",
    content: `Answer: B\n\nExplanation: The average lifetime of erythrocytes (red blood cells) in humans is approximately 120 days. After this period, they are typically removed from circulation by the spleen and liver.`,
    suggestions: [],
  },
  {
    type: "user",
    isImage: true,
    imageLabel: "math_question.jpg",
    caption: "Need help with this calculus problem!",
    imageContent: "Find the derivative of f(x) = 3x² + 2x - 5",
  },
  {
    type: "bot",
    content: `Answer: f'(x) = 6x + 2`,
    suggestions: [],
  },
];

const ChatMockup = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-brand mb-3 tracking-wide uppercase">
            See It In Action
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            From question to answer in seconds
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Watch how TakeMyTest solves any problem with detailed explanations
          </p>
        </div>

        {/* Chat window */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
          {/* Window header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-secondary/30">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-sm text-muted-foreground">
                TakeMyTest Bot
              </span>
            </div>
            <div className="w-12" />
          </div>

          {/* Messages */}
          <div className="p-4 md:p-6 space-y-4 max-h-[500px] overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[75%] ${
                    message.type === "user"
                      ? "bg-brand text-brand-foreground rounded-2xl rounded-br-md px-4 py-3"
                      : "space-y-3"
                  }`}
                >
                  {message.type === "user" ? (
                    message.isImage ? (
                      <div className="space-y-2">
                        {/* Test question image preview */}
                        <div className="relative rounded-lg overflow-hidden bg-white p-4">
                          <div className="text-black font-mono text-sm">
                            {message.imageContent}
                          </div>
                          {/* Overlay with file info */}
                          {/* <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm px-2 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <Image className="w-3 h-3 text-white/80" />
                              <span className="text-xs font-mono text-white/80">
                                {message.imageLabel}
                              </span>
                            </div>
                          </div> */}
                        </div>
                        {message.caption && (
                          <p className="text-sm">{message.caption}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-line">
                        {message.content}
                      </p>
                    )
                  ) : (
                    <>
                      <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                        <p className="text-sm whitespace-pre-line">
                          {message.content}
                        </p>
                      </div>
                      {message.suggestions && (
                        <div className="space-y-2 pl-2">
                          {message.suggestions.map((suggestion, sIndex) => (
                            <div
                              key={sIndex}
                              className="bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm hover:bg-secondary/80 transition-colors cursor-pointer"
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input bar */}
          <div className="px-4 py-3 border-t border-border bg-secondary/20">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-secondary rounded-xl px-4 py-2.5">
                <span className="text-sm text-muted-foreground">
                  Type your situation...
                </span>
              </div>
              <button className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center hover:bg-brand/90 transition-colors">
                <Send className="w-4 h-4 text-brand-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatMockup;
