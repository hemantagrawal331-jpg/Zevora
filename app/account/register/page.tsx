import type { Metadata } from "next";
import { Container } from "@/components/container";
import { AuthForm } from "@/components/auth-form";
import { signUpAction } from "@/lib/commerce/auth-actions";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <Container className="max-w-3xl py-12">
      <AuthForm
        action={signUpAction}
        title="Create an account"
        submitLabel="Create account"
        fields={[
          { name: "fullName", label: "Name", type: "text", autoComplete: "name" },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
        ]}
        alternate={{ href: "/account/login", label: "Already registered" }}
      />
    </Container>
  );
}
