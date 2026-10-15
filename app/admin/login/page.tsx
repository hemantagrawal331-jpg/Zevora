import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { Container } from "@/components/container";
import { adminAuthConfigured } from "@/lib/admin/config";
import { getAdminActor } from "@/lib/admin/guard";
import { safeNext } from "@/lib/admin/session";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

type Query = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function LoginPage({ searchParams }: { searchParams: Promise<Query> }) {
  return (
    <Suspense fallback={<Container className="py-16"><p className="sr-only">Loading sign in</p></Container>}>
      <LoginScreen searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginScreen({ searchParams }: { searchParams: Promise<Query> }) {
  const raw = await searchParams;
  const next = safeNext(one(raw.next));
  const actor = await getAdminActor();
  if (actor) redirect(next);

  return (
    <Container className="py-16">
      <p className="text-[11px] tracking-[0.18em] text-stone uppercase">Private</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">Sign in</h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-charcoal">Sourcing workspace for ZEVORA.</p>
      {adminAuthConfigured() ? (
        <LoginForm next={next} />
      ) : (
        <p className="mt-8 max-w-xl text-sm leading-6 text-charcoal">
          Set ADMIN_EMAIL, ADMIN_PASSWORD_HASH, and ADMIN_SESSION_SECRET before signing in. Create the password hash
          with npm run admin:hash. The session secret needs at least 32 characters.
        </p>
      )}
    </Container>
  );
}
