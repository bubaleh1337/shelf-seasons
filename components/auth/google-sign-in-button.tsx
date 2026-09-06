"use client";

import { useState } from "react";
import type { Locale } from "@/lib/shelf-seasons";
import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton({
  locale,
  label,
  pendingLabel,
  errorLabel,
}: {
  locale: Locale;
  label: string;
  pendingLabel: string;
  errorLabel: string;
}) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function signIn() {
    if (pending) return;
    setPending(true);
    setFailed(false);

    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("locale", locale);
    callback.searchParams.set("next", `/${locale}/app`);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback.toString(),
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) {
      setFailed(true);
      setPending(false);
    }
  }

  return (
    <div className="google-sign-in">
      <button
        type="button"
        className="google-button"
        onClick={() => void signIn()}
        disabled={pending}
        aria-busy={pending}
      >
        <GoogleMark />
        {pending ? pendingLabel : label}
      </button>
      {failed && (
        <p className="auth-error" role="alert">
          {errorLabel}
        </p>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.23-.2-1.77h-9.2v3.34h5.4a4.6 4.6 0 0 1-2 3.02v2.17h3.24c1.9-1.75 2.76-4.33 2.76-6.76Z" />
      <path fill="#34A853" d="M12.2 21.8c2.7 0 4.97-.9 6.63-2.43l-3.24-2.17c-.9.6-2.05.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H3.27v2.24a10 10 0 0 0 8.93 5.52Z" />
      <path fill="#FBBC05" d="M6.6 14.04a6 6 0 0 1 0-3.84V7.96H3.27a10 10 0 0 0 0 8.32l3.33-2.24Z" />
      <path fill="#EA4335" d="M12.2 6.08c1.47 0 2.78.5 3.82 1.5l2.88-2.8A9.65 9.65 0 0 0 12.2 2.2a10 10 0 0 0-8.93 5.76L6.6 10.2c.79-2.36 3-4.12 5.6-4.12Z" />
    </svg>
  );
}
