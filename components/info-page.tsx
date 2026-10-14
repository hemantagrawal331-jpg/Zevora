import type { ReactNode } from "react";
import { Container } from "@/components/container";

export function InfoPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Container className="max-w-3xl py-12 md:py-16">
      <p className="text-[11px] tracking-[0.2em] text-stone uppercase">{eyebrow}</p>
      <h1 className="mt-3 font-display text-5xl leading-none md:text-6xl">{title}</h1>
      <div className="mt-8 space-y-5 text-sm leading-7 text-charcoal">{children}</div>
    </Container>
  );
}
