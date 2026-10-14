"use client";

import Link from "next/link";
import { Container } from "@/components/container";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="max-w-lg py-24 text-center">
      <p className="text-[11px] tracking-[0.2em] text-stone uppercase">Something went wrong</p>
      <h1 className="mt-3 font-display text-5xl">This page did not load</h1>
      <p className="mt-4 text-sm leading-6 text-charcoal">
        Try again, or return to the collection.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="h-11 bg-ink px-6 text-[11px] tracking-[0.16em] text-ivory uppercase"
        >
          Try again
        </button>
        <Link href="/" className="h-11 border border-ink px-6 text-[11px] leading-[2.75rem] tracking-[0.16em] uppercase">
          Home
        </Link>
      </div>
    </Container>
  );
}
