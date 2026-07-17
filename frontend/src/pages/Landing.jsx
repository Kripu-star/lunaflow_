import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../components/Logo";
import heroLanding from "../assets/hero-landing.png";

const FEATURES = [
  {
    emoji: "📅",
    title: "Cycle Tracking",
    description: "Track your periods, predict your next cycle & phases.",
  },
  {
    emoji: "😊",
    title: "Mood Journal",
    description: "Log your moods & energy to understand yourself better.",
  },
  {
    emoji: "💬",
    title: "AI Companion",
    description: "Chat with your personal wellness companion.",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-rose-100">
      <div className="max-w-md mx-auto px-6 py-10">
        <Logo size="lg" className="justify-center mb-6" />

        {/* Hero illustration */}
        <div className="relative h-56 rounded-3xl overflow-hidden mb-8">
          <img
            src={heroLanding}
            alt="Woman looking at the moon"
            className="w-full h-full object-cover"
          />
        </div>

        <p className="text-center text-wine font-medium mb-2">
          Understand. Nurture. Flow.
        </p>
        <h1 className="font-display text-3xl font-semibold text-ink text-center leading-tight mb-3">
          Your Feminine Wellness Companion
        </h1>
        <p className="text-center text-ink/60 mb-8">
          Track your cycle, moods, and wellbeing with insights that empower
          you every day.
        </p>

        <div className="space-y-3 mb-8">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-rose-200 shadow-sm p-4 flex items-start gap-3"
            >
              <span className="text-2xl">{f.emoji}</span>
              <div>
                <h3 className="font-display font-semibold text-ink">
                  {f.title}
                </h3>
                <p className="text-sm text-ink/60">{f.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Link
            to="/register"
            className="block w-full text-center bg-wine text-rose-50 py-3 rounded-full font-medium hover:bg-wine-dark transition"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="block w-full text-center border border-wine text-wine py-3 rounded-full font-medium hover:bg-white transition"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
