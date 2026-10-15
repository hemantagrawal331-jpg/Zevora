import type { ReactNode } from "react";
import { logoutAction } from "@/lib/admin/actions";

export function SourcingHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <p className="text-[11px] tracking-[0.18em] text-stone uppercase">Private</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">{title}</h1>
      </div>
      <div className="flex items-center gap-6">
        {children}
        <form action={logoutAction}>
          <button type="submit" className="text-[11px] tracking-[0.16em] uppercase">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
