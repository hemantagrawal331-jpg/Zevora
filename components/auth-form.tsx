"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "@/lib/commerce/auth-actions";

const inputClass = "mt-2 w-full border-b border-ink bg-transparent py-3 outline-none";

export function AuthForm({
  action,
  title,
  submitLabel,
  next,
  fields,
  alternate,
}: {
  action: (state: AuthState, form: FormData) => Promise<AuthState>;
  title: string;
  submitLabel: string;
  next?: string;
  fields: { name: string; label: string; type: string; autoComplete: string }[];
  alternate?: { href: string; label: string };
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="mt-10 max-w-md" noValidate>
      <h1 className="font-display text-5xl">{title}</h1>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {fields.map((field) => (
        <label key={field.name} className="mt-6 block text-[11px] tracking-[0.16em] uppercase">
          {field.label}
          <input name={field.name} type={field.type} autoComplete={field.autoComplete} className={inputClass} required />
        </label>
      ))}
      <button disabled={pending} className="mt-8 h-11 bg-ink px-8 text-[11px] tracking-[0.18em] text-ivory uppercase disabled:bg-stone" type="submit">
        {pending ? "Please wait" : submitLabel}
      </button>
      {state.error ? <p className="mt-4 text-sm" role="alert">{state.error}</p> : null}
      {state.message ? <p className="mt-4 text-sm" role="status">{state.message}</p> : null}
      {alternate ? <Link href={alternate.href} className="mt-6 inline-block text-sm underline">{alternate.label}</Link> : null}
    </form>
  );
}
