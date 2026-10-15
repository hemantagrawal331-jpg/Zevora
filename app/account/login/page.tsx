import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/container";
import { AuthForm } from "@/components/auth-form";
import { safeCustomerNext } from "@/lib/commerce/access";
import { signInAction } from "@/lib/commerce/auth-actions";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <Suspense fallback={<Container className="py-16"><p>Loading sign-in…</p></Container>}>
      <Login searchParams={searchParams} />
    </Suspense>
  );
}

async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return (
    <Container className="max-w-3xl py-12">
      <AuthForm
        action={signInAction}
        title="Sign in"
        submitLabel="Sign in"
        next={safeCustomerNext(params.next)}
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
        alternate={{ href: "/account/register", label: "Create an account" }}
      />
      <a href="/account/reset" className="mt-4 inline-block text-sm underline">Forgot password</a>
    </Container>
  );
}
