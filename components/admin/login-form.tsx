"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/admin/actions";

const inputClass = "mt-2 w-full border border-line bg-transparent px-3 py-2 outline-none";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, {});

  return (
    <form action={action} className="mt-10 max-w-md" noValidate>
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="admin-email" className="text-[11px] tracking-[0.16em] uppercase">
          Email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          spellCheck={false}
          className={inputClass}
        />
      </div>
      <div className="mt-6">
        <label htmlFor="admin-password" className="text-[11px] tracking-[0.16em] uppercase">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>
      {state.formError ? (
        <p className="mt-6 text-sm" role="alert">
          {state.formError}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-8 h-11 bg-ink px-8 text-[11px] tracking-[0.18em] text-ivory uppercase hover:bg-charcoal disabled:opacity-60"
      >
        {pending ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
