import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { Container } from "@/components/container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact ZEVORA in Mumbai.",
};

export default function ContactPage() {
  return (
    <Container className="max-w-3xl py-12 md:py-16">
      <p className="text-[11px] tracking-[0.2em] text-stone uppercase">Contact</p>
      <h1 className="mt-3 font-display text-5xl md:text-6xl">Write to the house</h1>
      <address className="mt-6 space-y-1 text-sm leading-7 text-charcoal not-italic">
        <p>{site.contact.address}</p>
        <p>
          <a className="underline" href={`mailto:${site.contact.email}`}>
            {site.contact.email}
          </a>
        </p>
        <p>{site.contact.phone}</p>
        <p>{site.contact.hours}</p>
      </address>
      <ContactForm />
    </Container>
  );
}
