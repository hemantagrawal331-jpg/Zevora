import type { Metadata } from "next";
import { Container } from "@/components/container";
import { AuthForm } from "@/components/auth-form";
import { resetPasswordAction } from "@/lib/commerce/auth-actions";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPage() {
  return (
    <Container className="max-w-3xl py-12">
      <AuthForm
        action={resetPasswordAction}
        title="Reset password"
        submitLabel="Send reset link"
        fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
        alternate={{ href: "/account/login", label: "Back to sign in" }}
      />
    </Container>
  );
}
