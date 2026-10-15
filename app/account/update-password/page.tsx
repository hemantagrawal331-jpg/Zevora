import type { Metadata } from "next";
import { Container } from "@/components/container";
import { AuthForm } from "@/components/auth-form";
import { updatePasswordAction } from "@/lib/commerce/auth-actions";

export const metadata: Metadata = { title: "New password" };

export default function UpdatePasswordPage() {
  return (
    <Container className="max-w-3xl py-12">
      <AuthForm
        action={updatePasswordAction}
        title="Choose a new password"
        submitLabel="Update password"
        fields={[{ name: "password", label: "New password", type: "password", autoComplete: "new-password" }]}
      />
    </Container>
  );
}
