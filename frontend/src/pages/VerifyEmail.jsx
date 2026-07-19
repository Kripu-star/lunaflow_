import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmail, resendVerification } from "../api";
import Logo from "../components/Logo";
import WaveBackground from "../components/WaveBackground";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [resendEmail, setResendEmail] = useState("");
  const [resendState, setResendState] = useState("idle"); // idle | sending | sent

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    verifyEmail(token)
      .then((res) => setStatus(res && res.ok ? "success" : "error"))
      .catch(() => setStatus("error"));
  }, [token]);

  async function handleResend(e) {
    e.preventDefault();
    setResendState("sending");
    try {
      await resendVerification(resendEmail);
    } catch {
      // Endpoint always returns a generic success message, ignore network hiccups here
    } finally {
      setResendState("sent");
    }
  }

  return (
    <div className="relative min-h-screen bg-rose-50 flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md relative z-10 text-center">
        <Logo className="justify-center mb-4" />

        {status === "loading" && (
          <>
            <p className="text-4xl mb-3">⏳</p>
            <p className="text-ink/60 text-sm">Verifying your email...</p>
          </>
        )}

        {status === "success" && (
          <>
            <p className="text-4xl mb-3">✅</p>
            <h1 className="font-display text-xl font-semibold text-ink mb-2">
              Email verified
            </h1>
            <p className="text-ink/60 text-sm mb-6">
              Your account is active. You can log in now.
            </p>
            <Link
              to="/login"
              className="block w-full bg-wine text-rose-50 py-2.5 rounded-full font-medium hover:bg-wine-dark transition"
            >
              Log In
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <p className="text-4xl mb-3">⚠️</p>
            <h1 className="font-display text-xl font-semibold text-ink mb-2">
              Link invalid or expired
            </h1>
            <p className="text-ink/60 text-sm mb-6">
              This verification link no longer works. Enter your email below
              to get a new one.
            </p>
            <form onSubmit={handleResend} className="space-y-3">
              <input
                type="email"
                required
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-rose-200 rounded-lg focus:ring-2 focus:ring-wine/30 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                disabled={resendState !== "idle"}
                className="w-full bg-wine text-rose-50 py-2.5 rounded-full font-medium hover:bg-wine-dark transition disabled:opacity-50"
              >
                {resendState === "sending"
                  ? "Sending..."
                  : resendState === "sent"
                  ? "Email sent — check your inbox"
                  : "Resend verification email"}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-ink/50 mt-6">
          <Link to="/login" className="text-wine hover:underline">
            Back to Log In
          </Link>
        </p>
      </div>
      <WaveBackground className="h-40" />
    </div>
  );
}
