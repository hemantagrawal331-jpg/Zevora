"use client";

import { Container } from "@/components/container";

export default function SourcingError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="py-16">
      <h1 className="font-display text-4xl tracking-tight">Sourcing could not be loaded</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-charcoal">
        Try again. If this continues, check the database connection.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 h-11 bg-ink px-8 text-[11px] tracking-[0.18em] text-ivory uppercase"
      >
        Try again
      </button>
    </Container>
  );
}
