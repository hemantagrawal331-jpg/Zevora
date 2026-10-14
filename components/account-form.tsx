"use client";

import { useState } from "react";
import { validateEmail } from "@/lib/format";

export function AccountForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [checked, setChecked] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: { email?: string; password?: string } = {};
    const emailError = validateEmail(email);
    if (emailError) nextErrors.email = emailError;
    if (password.length < 8) nextErrors.password = "Use at least 8 characters.";
    setErrors(nextErrors);
    setChecked(Object.keys(nextErrors).length === 0);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10 max-w-md">
      <div>
        <label htmlFor="account-email" className="text-[11px] tracking-[0.16em] uppercase">
          Email
        </label>
        <input
          id="account-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "account-email-error" : undefined}
          className="mt-1 w-full border-b border-ink bg-transparent py-3 outline-none"
        />
        {errors.email ? (
          <p id="account-email-error" className="mt-2 text-sm">
            {errors.email}
          </p>
        ) : null}
      </div>
      <div className="mt-6">
        <label htmlFor="account-password" className="text-[11px] tracking-[0.16em] uppercase">
          Password
        </label>
        <input
          id="account-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "account-password-error" : undefined}
          className="mt-1 w-full border-b border-ink bg-transparent py-3 outline-none"
        />
        {errors.password ? (
          <p id="account-password-error" className="mt-2 text-sm">
            {errors.password}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        className="mt-8 h-11 bg-ink px-8 text-[11px] tracking-[0.18em] text-ivory uppercase hover:bg-charcoal"
      >
        Continue
      </button>
      <p className="mt-4 text-sm leading-6 text-charcoal" role="status">
        {checked
          ? "Accounts are not connected yet. These details were checked in the browser and were not sent or stored."
          : "Sign-in is not connected. Your password is not saved."}
      </p>
    </form>
  );
}
