"use client";

import { useState } from "react";
import { validateEmail } from "@/lib/format";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [saved, setSaved] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: { name?: string; email?: string; message?: string } = {};
    if (!name.trim()) nextErrors.name = "Enter your name.";
    const emailError = validateEmail(email);
    if (emailError) nextErrors.email = emailError;
    if (message.trim().length < 12) nextErrors.message = "Write a short message, at least a sentence.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSaved(false);
      return;
    }
    window.localStorage.setItem(
      "zevora-contact",
      JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        savedAt: new Date().toISOString(),
      }),
    );
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10 max-w-xl">
      <Field
        id="contact-name"
        label="Name"
        value={name}
        error={errors.name}
        onChange={setName}
        autoComplete="name"
      />
      <Field
        id="contact-email"
        label="Email"
        type="email"
        value={email}
        error={errors.email}
        onChange={setEmail}
        autoComplete="email"
      />
      <div className="mt-6">
        <label htmlFor="contact-message" className="text-[11px] tracking-[0.16em] uppercase">
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          className="mt-2 w-full border border-line bg-transparent p-3 outline-none"
        />
        {errors.message ? (
          <p id="contact-message-error" className="mt-2 text-sm">
            {errors.message}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        className="mt-6 h-11 bg-ink px-8 text-[11px] tracking-[0.18em] text-ivory uppercase hover:bg-charcoal"
      >
        Save message
      </button>
      <p className="mt-4 text-sm leading-6 text-charcoal" role="status">
        {saved
          ? "Saved on this device. No message is sent — contact is not connected to an inbox."
          : "This form does not send email. It keeps the message in your browser so you can see validation working."}
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  error,
  onChange,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div className="mt-6">
      <label htmlFor={id} className="text-[11px] tracking-[0.16em] uppercase">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-1 w-full border-b border-ink bg-transparent py-3 outline-none"
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
