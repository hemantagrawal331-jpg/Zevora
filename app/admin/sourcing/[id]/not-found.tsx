import Link from "next/link";
import { Container } from "@/components/container";

export default function SourcingRecordNotFound() {
  return (
    <Container className="py-16">
      <h1 className="font-display text-4xl tracking-tight">This record is not available</h1>
      <p className="mt-4 text-sm text-charcoal">The link does not match a sourcing record.</p>
      <Link href="/admin/sourcing" className="mt-8 inline-block text-[11px] tracking-[0.16em] uppercase">
        All records
      </Link>
    </Container>
  );
}
