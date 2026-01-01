import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

export default function Page() {
  return (
    <>
      <title>Privacy Policy - TakeMyTest</title>
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold tracking-tight mb-8">
            Privacy Policy
          </h1>

          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
            <p className="text-lg">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                1. Information We Collect
              </h2>
              <p>When you use TakeMyTest, we may collect:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Telegram user ID and username</li>
                <li>Images and text you upload for analysis</li>
                <li>Usage data and interaction history</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                2. How We Use Your Information
              </h2>
              <p>We use collected information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and improve the Service</li>
                <li>Generate personalized responses and suggestions</li>
                <li>Communicate with you about the Service</li>
                <li>Ensure security and prevent abuse</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                3. Data Storage and Security
              </h2>
              <p>
                We implement appropriate security measures to protect your data.
                Uploaded images are processed and not permanently stored unless
                required for service functionality. We do not sell your personal
                information to third parties.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                4. Third-Party Services
              </h2>
              <p>
                Our Service operates through Telegram and may use third-party AI
                services for content generation. These services have their own
                privacy policies that govern their use of data.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                5. Your Rights
              </h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Request access to your personal data</li>
                <li>Request deletion of your data</li>
                <li>Opt out of certain data collection</li>
                <li>Stop using the Service at any time</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                6. Data Retention
              </h2>
              <p>
                We retain your data only as long as necessary to provide the
                Service. You can request deletion of your data by contacting us
                through the Telegram bot.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                7. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify users of any material changes through the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                8. Contact
              </h2>
              <p>
                For privacy-related questions or requests, please reach out
                through our Telegram bot.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
