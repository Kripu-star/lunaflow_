import os
import sys
from typing import Optional
import requests

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM", "LunaFlow <onboarding@resend.dev>")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

RESEND_API_URL = "https://api.resend.com/emails"


def _safe_console_text(text: str) -> str:
    """
    Some consoles (e.g. Windows' default cp1252 terminal) can't print emoji or
    other non-ASCII characters and will crash on print(). Dev-only logging
    should never take the app down, so degrade unsupported characters instead.
    """
    encoding = getattr(sys.stdout, "encoding", None) or "ascii"
    return text.encode(encoding, errors="replace").decode(encoding)


def _console_log_email(to: str, subject: str, html: str) -> None:
    print(_safe_console_text("--- [DEV] Email not sent (RESEND_API_KEY unset) ---"))
    print(_safe_console_text(f"To: {to}\nSubject: {subject}\n{html}"))
    print(_safe_console_text("-----------------------------------------------------"))


def send_email(to: str, subject: str, html: str) -> bool:
    """
    Send an email via Resend. If RESEND_API_KEY isn't configured (local dev),
    logs the email instead of sending so local development doesn't hard-fail.
    Returns True if the email was sent (or logged), False on a real send failure.
    """
    if not RESEND_API_KEY:
        _console_log_email(to, subject, html)
        return True

    try:
        res = requests.post(
            RESEND_API_URL,
            headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
            json={
                "from": EMAIL_FROM,
                "to": [to],
                "subject": subject,
                "html": html,
            },
            timeout=10,
        )
        if res.status_code >= 400:
            print(f"Resend send failed ({res.status_code}): {res.text}")
            return False
        return True
    except requests.RequestException as e:
        print(f"Resend send error: {e}")
        return False


def send_verification_email(to_email: str, full_name: Optional[str], token: str) -> bool:
    verify_link = f"{FRONTEND_URL}/verify-email?token={token}"
    name = full_name or "there"
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #FDF2F5; padding: 32px; border-radius: 16px;">
      <h1 style="color: #7A2E45; font-size: 22px;">🌙 LunaFlow</h1>
      <p style="color: #261C2C;">Hi {name},</p>
      <p style="color: #261C2C;">
        Thanks for signing up! Please confirm your email address to activate your account.
      </p>
      <a href="{verify_link}"
         style="display: inline-block; background: #7A2E45; color: #FDF2F5; padding: 12px 28px;
                border-radius: 999px; text-decoration: none; font-weight: 600; margin: 16px 0;">
        Verify Email
      </a>
      <p style="color: #6b6b6b; font-size: 13px;">
        This link expires in 24 hours. If you didn't sign up for LunaFlow, you can ignore this email.
      </p>
    </div>
    """
    return send_email(to_email, "Verify your LunaFlow account", html)
