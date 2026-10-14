import Link from "next/link";
import { Container } from "@/components/container";

export default function NotFound() {
  return (
    <Container className="max-w-lg py-24 text-center">
      <p className="text-[11px] tracking-[0.2em] text-stone uppercase">404</p>
      <h1 className="mt-3 font-display text-5xl">This page is not in the edit</h1>
      <p className="mt-4 text-sm leading-6 text-charcoal">
        The link may be out of date. The collection is still here.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center bg-ink px-6 text-[11px] tracking-[0.16em] text-ivory uppercase"
      >
        Back home
      </Link>
    </Container>
  );
}
