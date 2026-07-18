import { Link } from "react-router-dom";
import Logo from "../components/Logo";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: [
      'By creating an account and using LunaFlow ("the App"), you agree to these Terms and Conditions. If you do not agree, do not use the App.',
    ],
  },
  {
    title: "2. Who Can Use LunaFlow",
    body: [
      "You must be at least 13 years of age to use this App. By registering, you confirm that you meet this age requirement. LunaFlow is a personal health tracking tool intended for individuals who menstruate.",
    ],
  },
  {
    title: "3. What LunaFlow Does",
    body: ["LunaFlow allows you to:"],
    list: [
      "Log menstrual cycles — record period start dates, duration, and notes",
      "Predict future periods — using a weighted moving average of your cycle history",
      "Track your mood and energy — log daily mood scores and notes",
      "View cycle phase information — understand your current cycle phase (menstruation, follicular, ovulation, luteal) with personalized tips",
      "Chat with an AI wellness companion — converse with AI personas powered by Groq's Llama 3.3 language model",
    ],
  },
  {
    title: "4. Health Disclaimer",
    body: ["LunaFlow is not a medical device and does not provide medical advice."],
    list: [
      "Cycle predictions are estimates based on your logged history. They are not guaranteed to be accurate.",
      "AI companion responses are for general wellness information and emotional support only. They are not a substitute for professional medical advice, diagnosis, or treatment.",
      "Always consult a qualified healthcare provider for medical concerns, especially regarding reproductive health, pregnancy, or any symptoms you are experiencing.",
      "Do not disregard professional medical advice or delay seeking it because of anything you read or receive through this App.",
    ],
  },
  {
    title: "5. Your Account",
    list: [
      "You are responsible for keeping your password secure.",
      "You are responsible for all activity that occurs under your account.",
      "You must provide a valid email address at registration.",
      "Do not share your account with others.",
      "You may delete your account at any time by contacting us at pushpamkumari3122@gmail.com.",
    ],
  },
  {
    title: "6. Your Data",
    list: [
      "Your cycle logs, mood entries, and profile information are stored securely in our database.",
      "Your chat conversations with the AI companion are processed by Groq's API (groq.com) and are not permanently stored on our servers. Chat history is stored locally in your browser via localStorage.",
      "We do not sell your data to third parties.",
      "We do not use your data for advertising purposes.",
      "We use your data solely to provide the App's features to you.",
    ],
  },
  {
    title: "7. Data You Enter",
    body: ["You understand and agree that:"],
    list: [
      "The accuracy of predictions depends entirely on the accuracy of the data you log.",
      "You should not log false or misleading health information.",
      "Health data you enter is sensitive. You are responsible for ensuring your device is secure and that you log out of the App when using shared devices.",
    ],
  },
  {
    title: "8. AI Companion",
    body: [
      "The AI wellness companion (powered by Groq/Llama 3.3-70B) is provided for informational and emotional support purposes only. You understand that:",
    ],
    list: [
      "AI responses are generated automatically and may not always be accurate or appropriate for your situation.",
      "The AI personas are fictional characters, not real people or licensed professionals.",
      "You should not make medical decisions based solely on AI companion responses.",
      "Conversations may be processed by Groq's infrastructure. Do not share information you would not want processed by a third-party AI provider.",
    ],
  },
  {
    title: "9. Acceptable Use",
    body: ["You agree not to:"],
    list: [
      "Use the App for any unlawful purpose",
      "Attempt to gain unauthorized access to the App's systems or other users' accounts",
      "Reverse engineer, decompile, or attempt to extract the source code of the App",
      "Use the App in any way that could damage, disable, or impair it",
    ],
  },
  {
    title: "10. Intellectual Property",
    body: [
      "LunaFlow, including its name, design, code, and content, is the work of Pushpam Kumari. You may not copy, reproduce, or redistribute any part of the App without permission.",
    ],
  },
  {
    title: "11. Availability",
    body: [
      "LunaFlow is a personal project provided free of charge. We do not guarantee uninterrupted availability of the App. The App may be taken down, modified, or changed at any time without notice.",
    ],
  },
  {
    title: "12. Limitation of Liability",
    body: [
      "To the fullest extent permitted by law, LunaFlow and its developer shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App, including but not limited to reliance on health predictions or AI companion responses.",
    ],
  },
  {
    title: "13. Changes to These Terms",
    body: [
      "We may update these Terms from time to time. Continued use of the App after changes are posted constitutes acceptance of the updated Terms.",
    ],
  },
  {
    title: "14. Contact",
    body: [
      "If you have questions about these Terms, contact:",
      "Pushpam Kumari — pushpamkumari3122@gmail.com",
    ],
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-rose-50">
      <header className="bg-white border-b border-rose-200">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <Link to="/register" className="text-sm text-wine hover:underline">
            ← Back to Sign Up
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink mb-1">
          Terms and Conditions
        </h1>
        <p className="text-sm text-ink/50 mb-8">Last updated: July 18, 2026</p>

        <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-6 sm:p-8 space-y-6">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="font-display font-semibold text-ink mb-2">
                {section.title}
              </h2>
              {section.body?.map((p, i) => (
                <p key={i} className="text-sm text-ink/70 leading-relaxed mb-2">
                  {p}
                </p>
              ))}
              {section.list && (
                <ul className="list-disc list-outside pl-5 space-y-1">
                  {section.list.map((item, i) => (
                    <li key={i} className="text-sm text-ink/70 leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <p className="text-sm text-ink/60 leading-relaxed border-t border-rose-100 pt-6">
            By checking the box at registration, you confirm that you have
            read, understood, and agree to these Terms and Conditions.
          </p>
        </div>
      </main>
    </div>
  );
}
