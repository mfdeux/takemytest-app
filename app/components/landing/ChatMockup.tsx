import { Image, Send } from "lucide-react";
import profilePreview from "~/assets/profile-preview.jpg";

const messages = [
  {
    type: "user",
    isImage: true,
    imageLabel: "dating_profile.jpg",
    caption: "Help me start a conversation with her!",
  },
  {
    type: "bot",
    content:
      "She loves hiking and photography! Here are 3 personalized openers:",
    suggestions: [
      "\"I see you're into hiking—what's your favorite trail that's worth waking up at 5am for?\"",
      '"Your photography is incredible! Do you prefer golden hour or that perfect overcast light?"',
      '"Fellow outdoor enthusiast here 👋 What\'s on your hiking bucket list?"',
    ],
  },
  {
    type: "user",
    content:
      "She replied 'I love the Cascades! Haven't explored much though.' What should I say?",
  },
  {
    type: "bot",
    content: "Perfect opening to suggest a date! Try:",
    suggestions: [
      '"The Cascades are amazing! I know a trail with incredible views—want to explore it together sometime?"',
    ],
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
            Real conversations, real results
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Watch how Linecraft helps you navigate any dating scenario
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
                Linecraft Bot
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
                        {/* Profile image preview */}
                        <div className="relative w-48 h-64 rounded-lg overflow-hidden">
                          <img
                            src={profilePreview}
                            alt="Dating profile"
                            className="w-full h-full object-cover"
                          />
                          {/* Overlay with file info */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm px-2 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <Image className="w-3 h-3 text-white/80" />
                              <span className="text-xs font-mono text-white/80">
                                {message.imageLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                        {message.caption && (
                          <p className="text-sm">{message.caption}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )
                  ) : (
                    <>
                      <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                        <p className="text-sm">{message.content}</p>
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
