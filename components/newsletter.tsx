"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/container";
import { validateEmail } from "@/lib/format";

const STORAGE_KEY = "zevora-newsletter";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; consent?: string }>({});
  const [saved, setSaved] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: { email?: string; consent?: string } = {};
    const emailError = validateEmail(email);
    if (emailError) nextErrors.email = emailError;
    if (!consent) nextErrors.consent = "Please confirm you agree to hear from ZEVORA.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSaved(false);
      return;
    }

    const entry = { email: email.trim(), savedAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    setSaved(true);
  }

  return (
    <section className="border-t border-line" aria-labelledby="newsletter-title">
      <Container className="grid gap-8 py-16 md:grid-cols-[0.8fr_1.2fr] md:py-20">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-stone uppercase">The list</p>
          <h2 id="newsletter-title" className="mt-3 max-w-sm font-display text-4xl leading-none md:text-5xl">
            Notes from the house
          </h2>
        </div>
        <form onSubmit={onSubmit} noValidate className="max-w-xl">
          <p className="text-sm leading-6 text-charcoal">
            Occasional letters on new arrivals. No weekly noise.
          </p>
          <div className="mt-6">
            <label htmlFor="newsletter-email" className="text-[11px] tracking-[0.16em] uppercase">
              Email
            </label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "newsletter-email-error" : undefined}
              className="mt-1 w-full border-b border-ink bg-transparent py-3 text-base outline-none"
            />
            {errors.email ? (
              <p id="newsletter-email-error" className="mt-2 text-sm text-charcoal">
                {errors.email}
              </p>
            ) : null}
          </div>
          <div className="mt-5">
            <label className="flex items-start gap-3 text-sm leading-6 text-charcoal">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1 h-4 w-4 accent-ink"
                aria-invalid={Boolean(errors.consent)}
                aria-describedby={errors.consent ? "newsletter-consent-error" : undefined}
              />
              <span>
                I agree to receive emails from ZEVORA and I have read the{" "}
                <Link href="/privacy" className="underline">
                  privacy policy
                </Link>
                .
              </span>
            </label>
            {errors.consent ? (
              <p id="newsletter-consent-error" className="mt-2 text-sm text-charcoal">
                {errors.consent}
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            className="mt-6 h-11 bg-ink px-8 text-[11px] tracking-[0.18em] text-ivory uppercase hover:bg-charcoal"
          >
            Subscribe
          </button>
          <p className="mt-4 text-xs leading-5 text-stone" role="status">
            {saved
              ? "Saved on this device. Email delivery is not connected yet, so nothing will be sent."
              : "This preview stores the signup in your browser only."}
          </p>
        </form>
      </Container>
    </section>
  );
}
