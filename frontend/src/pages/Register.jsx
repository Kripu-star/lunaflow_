import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api";
import Logo from "../components/Logo";
import WaveBackground from "../components/WaveBackground";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!agreed) {
      setError("Please agree to the Terms & Privacy Policy to continue.");
      return;
    }

    setLoading(true);
    try {
      const res = await register(email, password, fullName);
      if (res.ok) {
        navigate("/login");
      } else {
        const data = await res.json();
        setError(data.detail || "Registration failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-rose-50 flex flex-col items-center justify-center p-4 overflow-hidden">
      <Link
        to="/"
        className="absolute top-6 left-6 text-ink/50 hover:text-wine transition z-10"
      >
        ←
      </Link>

      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Logo className="justify-center mb-2" />
          <p className="text-ink/60 mt-2">Start your wellness journey today</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-rose-200 rounded-lg focus:ring-2 focus:ring-wine/30 focus:border-transparent outline-none"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-rose-200 rounded-lg focus:ring-2 focus:ring-wine/30 focus:border-transparent outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-rose-200 rounded-lg focus:ring-2 focus:ring-wine/30 focus:border-transparent outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-wine text-sm"
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-ink/60">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 accent-wine"
            />
            I agree to the{" "}
            <Link
              to="/terms"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-wine underline hover:no-underline"
            >
              Terms & Privacy Policy
            </Link>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-wine text-rose-50 py-2.5 rounded-full font-medium hover:bg-wine-dark transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-ink/50 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-wine hover:underline">
            Log in
          </Link>
        </p>
      </div>

      <WaveBackground className="h-40" />
    </div>
  );
}
