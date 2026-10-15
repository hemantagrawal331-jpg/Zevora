import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/container";
import { AuthForm } from "@/components/auth-form";
import { signOutAction, updateProfileAction } from "@/lib/commerce/auth-actions";
import { saveAddressAction } from "@/lib/commerce/actions";
import { getCatalogueProfile } from "@/lib/commerce/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AddressForm } from "@/components/address-form";

export const metadata: Metadata = {
  title: "Account",
  description: "Your ZEVORA account, addresses, and orders.",
};

export default function AccountPage() {
  return (
    <Suspense fallback={<Container className="py-16"><p>Loading account…</p></Container>}>
      <Account />
    </Suspense>
  );
}

async function Account() {
  if (!isSupabaseConfigured()) {
    return (
      <Container className="max-w-3xl py-12">
        <h1 className="font-display text-5xl">Your account</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-charcoal">
          Supabase is not configured, so registration and sign-in are unavailable. Add the public project URL and anon key, then restart the app. No account was created.
        </p>
      </Container>
    );
  }
  const profile = await getCatalogueProfile();
  if (!profile) {
    return (
      <Container className="max-w-3xl py-12">
        <p className="text-[11px] tracking-[0.2em] text-stone uppercase">Account</p>
        <div className="mt-6 flex gap-6 text-sm">
          <Link href="/account/login" className="underline">Sign in</Link>
          <Link href="/account/register" className="underline">Create an account</Link>
        </div>
      </Container>
    );
  }
  const supabase = await createSupabaseServer();
  const addresses = supabase
    ? await supabase.from("addresses").select("id, full_name, line1, city, postal_code").eq("user_id", profile.id)
    : { data: [] };
  const rows = (addresses.data as { id: string; full_name: string; line1: string; city: string; postal_code: string }[] | null) ?? [];
  return (
    <Container className="max-w-3xl py-12">
      <p className="text-[11px] tracking-[0.2em] text-stone uppercase">Account</p>
      <h1 className="mt-3 font-display text-5xl">{profile.fullName || "Your account"}</h1>
      <p className="mt-3 text-sm text-charcoal">{profile.email}</p>
      <AuthForm
        action={updateProfileAction}
        title="Profile"
        submitLabel="Save profile"
        fields={[{ name: "fullName", label: "Name", type: "text", autoComplete: "name" }]}
      />
      <div className="mt-10 flex gap-6 text-sm">
        <Link href="/account/orders" className="underline">Orders</Link>
        <form action={signOutAction}><button className="underline" type="submit">Sign out</button></form>
      </div>
      <h2 className="mt-12 font-display text-4xl">Addresses</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {rows.map((address) => (
          <li key={address.id}>{address.full_name}, {address.line1}, {address.city} {address.postal_code}</li>
        ))}
        {rows.length === 0 ? <li>No saved addresses.</li> : null}
      </ul>
      <AddressForm action={saveAddressAction} />
    </Container>
  );
}
