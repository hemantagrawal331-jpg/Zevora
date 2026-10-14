import type { Metadata } from "next";
import { AccountForm } from "@/components/account-form";
import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "Account",
  description: "ZEVORA account. Sign-in is not connected in this preview.",
};

export default function AccountPage() {
  return (
    <Container className="max-w-3xl py-12 md:py-16">
      <p className="text-[11px] tracking-[0.2em] text-stone uppercase">Account</p>
      <h1 className="mt-3 font-display text-5xl md:text-6xl">Your account</h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-charcoal">
        Online accounts are not open yet. You can check an email and password here. Nothing is sent, and the password is not stored.
      </p>
      <AccountForm />
    </Container>
  );
}
