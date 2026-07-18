import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiCall } from "../api";
import avatarDoctor from "../assets/avatar-doctor.png";
import avatarGuardian from "../assets/avatar-guardian.png";
import avatarLove from "../assets/avatar-love.png";

const PERSONAS = {
  doctor: {
    label: "Dr.",
    avatar: avatarDoctor,
    color: "blue",
    greeting: "Hello! I'm Dr. Luna, your women's health companion. How can I help you today?",
  },
  parent: {
    label: "Guardian",
    avatar: avatarGuardian,
    color: "olive",
    greeting: "Hi sweetheart! I'm here for you. What's on your mind today?",
  },
  partner: {
    label: "Love",
    avatar: avatarLove,
    color: "purple",
    greeting: "Hey, I'm here. Whatever you're feeling, you can tell me. How are you doing?",
  },
};

const COLOR_STYLES = {
  blue: {
    button: "bg-[#5B6FA8] hover:bg-[#4A5D9E]",
    bubble: "bg-[#E3E9FB] text-[#3A4A80]",
    ring: "ring-[#B9C6ED]",
    active: "bg-[#5B6FA8] text-white",
    inactive: "bg-white text-[#5B6FA8] border border-[#B9C6ED]",
  },
  olive: {
    button: "bg-[#6F8049] hover:bg-[#5B6B34]",
    bubble: "bg-[#EAF0DD] text-[#4B5A2A]",
    ring: "ring-[#C7D6AE]",
    active: "bg-[#6F8049] text-white",
    inactive: "bg-white text-[#6F8049] border border-[#C7D6AE]",
  },
  purple: {
    button: "bg-[#7C4FA3] hover:bg-[#6B3E90]",
    bubble: "bg-[#F0E6F8] text-[#5B3A7A]",
    ring: "ring-[#CBB0E3]",
    active: "bg-[#7C4FA3] text-white",
    inactive: "bg-white text-[#7C4FA3] border border-[#CBB0E3]",
  },
};

export default function Chat() {
  const [searchParams] = useSearchParams();
  const [persona, setPersona] = useState(
    searchParams.get("persona") || "doctor"
  );
  const [allMessages, setAllMessages] = useState(() => {
  const saved = localStorage.getItem("luna_chat_history");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // corrupted data, start fresh
    }
  }
  return {
    doctor: [{ role: "model", content: PERSONAS.doctor.greeting }],
    parent: [{ role: "model", content: PERSONAS.parent.greeting }],
    partner: [{ role: "model", content: PERSONAS.partner.greeting }],
  };
});
useEffect(() => {
  localStorage.setItem("luna_chat_history", JSON.stringify(allMessages));
}, [allMessages]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();



  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, allMessages[persona]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message immediately
    const currentMessages = allMessages[persona];
    const updatedMessages = [...currentMessages, { role: "user", content: userMessage }];
    setAllMessages(prev => ({ ...prev, [persona]: updatedMessages }));
    setLoading(true);

    try {
      const res = await apiCall("/chat", {
        method: "POST",
        body: JSON.stringify({
          persona,
          message: userMessage,
          history: updatedMessages.slice(1, -1), // exclude greeting and current
        }),
      });

      if (res && res.ok) {
        const data = await res.json();
        setAllMessages(prev => ({
  ...prev,
  [persona]: [...updatedMessages, { role: "model", content: data.response }]
}));
      } else if (!res) {
        navigate("/login");
      } else {
        setAllMessages(prev => ({
  ...prev,
  [persona]: [...updatedMessages, { role: "model", content: "Sorry, something went wrong. Please try again." }]
}));
      }
    } catch {
      setAllMessages(prev => ({
  ...prev,
  [persona]: [...updatedMessages, { role: "model", content: "Sorry, something went wrong. Please try again." }]
}));
    } finally {
      setLoading(false);
    }
  }
 function clearHistory() {
  const fresh = {
    doctor: [{ role: "model", content: PERSONAS.doctor.greeting }],
    parent: [{ role: "model", content: PERSONAS.parent.greeting }],
    partner: [{ role: "model", content: PERSONAS.partner.greeting }],
  };
  setAllMessages(fresh);
  localStorage.removeItem("luna_chat_history");
}

  function switchPersona(newPersona) {
    setPersona(newPersona);
    // Messages reset via useEffect
  }

  const currentPersona = PERSONAS[persona];
  const colors = COLOR_STYLES[currentPersona.color];

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-rose-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-rose-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-ink/50 hover:text-wine text-sm"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <img
              src={currentPersona.avatar}
              alt={currentPersona.label}
              className={`w-9 h-9 rounded-full object-cover ring-2 ${colors.ring}`}
            />
            <h1 className="font-display font-semibold text-ink text-sm leading-tight">
              {currentPersona.label}
            </h1>
          </div>
          <button
            onClick={clearHistory}
            title="Clear history"
            className="text-ink/40 hover:text-wine transition text-lg"
          >
            ⚙
          </button>
        </div>
      </header>

      {/* Persona Switcher */}
      <div className="max-w-2xl mx-auto w-full px-4 py-3">
        <div className="flex gap-2 justify-center">
          {Object.entries(PERSONAS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => switchPersona(key)}
              className={`flex items-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full text-sm font-medium transition ${
                persona === key
                  ? COLOR_STYLES[p.color].active
                  : COLOR_STYLES[p.color].inactive
              }`}
            >
              <img
                src={p.avatar}
                alt=""
                className="w-6 h-6 rounded-full object-cover"
              />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 overflow-y-auto pb-4">
        <div className="space-y-3">
          {allMessages[persona].map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role !== "user" && (
                <img
                  src={currentPersona.avatar}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover mr-2 self-end mb-1"
                />
              )}
              <div
                className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-wine text-rose-50 rounded-br-sm"
                    : `${colors.bubble} rounded-bl-sm`
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <img
                src={currentPersona.avatar}
                alt=""
                className="w-8 h-8 rounded-full object-cover mr-2"
              />
              <div className={`px-4 py-3 rounded-2xl rounded-bl-sm ${colors.bubble}`}>
                <div className="flex gap-1 items-center h-4">
                  <div className="w-2 h-2 bg-ink/30 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-ink/30 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-ink/30 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-rose-200 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Talk to ${currentPersona.label}...`}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-rose-200 rounded-full focus:ring-2 focus:ring-wine/30 focus:border-transparent outline-none text-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className={`px-4 py-2 rounded-full text-white text-sm font-medium transition disabled:opacity-50 ${colors.button}`}
            >
              Send
            </button>
          </form>
          <p className="text-xs text-ink/40 text-center mt-2">
            AI companion — not a substitute for real medical advice
          </p>
        </div>
      </div>
    </div>
  );
}
