import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiCall } from "../api";

const PERSONAS = {
  doctor: {
    name: "Dr. Luna",
    emoji: "👩‍⚕️",
    description: "Women's health physician",
    color: "blue",
    greeting: "Hello! I'm Dr. Luna, your women's health companion. How can I help you today?",
  },
  parent: {
    name: "Mama Luna",
    emoji: "🤱",
    description: "Nurturing parent figure",
    color: "green",
    greeting: "Hi sweetheart! I'm here for you. What's on your mind today?",
  },
  partner: {
    name: "Luna",
    emoji: "💜",
    description: "Supportive partner",
    color: "purple",
    greeting: "Hey, I'm here. Whatever you're feeling, you can tell me. How are you doing?",
  },
};

const COLOR_STYLES = {
  blue: {
    button: "bg-blue-600 hover:bg-blue-700",
    bubble: "bg-blue-100 text-blue-900",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    active: "bg-blue-600 text-white",
    inactive: "bg-white text-blue-600 border border-blue-200",
  },
  green: {
    button: "bg-green-600 hover:bg-green-700",
    bubble: "bg-green-100 text-green-900",
    border: "border-green-200",
    badge: "bg-green-100 text-green-700",
    active: "bg-green-600 text-white",
    inactive: "bg-white text-green-600 border border-green-200",
  },
  purple: {
    button: "bg-purple-600 hover:bg-purple-700",
    bubble: "bg-purple-100 text-purple-900",
    border: "border-purple-200",
    badge: "bg-purple-100 text-purple-700",
    active: "bg-purple-600 text-white",
    inactive: "bg-white text-purple-600 border border-purple-200",
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back
          </button>
          <button
  onClick={clearHistory}
  className="text-xs text-gray-400 hover:text-red-400 transition"
>
  Clear history
</button>
          <h1 className="font-bold text-gray-800">
            {currentPersona.emoji} {currentPersona.name}
          </h1>
          <span className={`text-xs px-2 py-1 rounded-full ${colors.badge}`}>
            {currentPersona.description}
          </span>
        </div>
      </header>

      {/* Persona Switcher */}
      <div className="max-w-2xl mx-auto w-full px-4 py-3">
        <div className="flex gap-2 justify-center">
          {Object.entries(PERSONAS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => switchPersona(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                persona === key
                  ? COLOR_STYLES[p.color].active
                  : COLOR_STYLES[p.color].inactive
              }`}
            >
              {p.emoji} {p.name}
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
                <span className="text-2xl mr-2 self-end mb-1">
                  {currentPersona.emoji}
                </span>
              )}
              <div
                className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gray-800 text-white rounded-br-sm"
                    : `${colors.bubble} rounded-bl-sm`
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <span className="text-2xl mr-2">{currentPersona.emoji}</span>
              <div className={`px-4 py-3 rounded-2xl rounded-bl-sm ${colors.bubble}`}>
                <div className="flex gap-1 items-center h-4">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Talk to ${currentPersona.name}...`}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className={`px-4 py-2 rounded-full text-white text-sm font-medium transition disabled:opacity-50 ${colors.button}`}
            >
              Send
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-2">
            AI companion — not a substitute for real medical advice
          </p>
        </div>
      </div>
    </div>
  );
}


