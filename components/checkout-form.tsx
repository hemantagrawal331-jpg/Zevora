"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Container } from "@/components/container";
import { OrderTotals } from "@/components/order-totals";
import { currentBagLines, replaceBag, useBag } from "@/components/store";
import { createCheckoutOrderAction, previewCouponAction } from "@/lib/commerce/checkout-actions";
import { indianStates } from "@/lib/commerce/checkout-input";
import { quoteCheckout, type CheckoutQuote } from "@/lib/commerce/quote";

const CHECKOUT_KEY = "zevora-checkout-key";

export type CheckoutAddress = {
  id: string;
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
};

const fieldClass = "mt-2 w-full border border-line bg-transparent px-3 py-3 text-base outline-none";

export function CheckoutForm({
  profile,
  addresses,
  razorpayReady,
  canOrder,
}: {
  profile: { fullName: string; email: string } | null;
  addresses: CheckoutAddress[];
  razorpayReady: boolean;
  canOrder: boolean;
}) {
  const bag = useBag();
  const router = useRouter();
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? "new");
  const [pending, setPending] = useState(false);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [error, setError] = useState("");
  const [couponQuote, setCouponQuote] = useState<CheckoutQuote | null>(null);
  const catalogueLines = bag.lines.filter((line) => line.variantId);
  const sampleLines = bag.lines.filter((line) => !line.variantId);

  function checkoutKey() {
    const existing = window.sessionStorage.getItem(CHECKOUT_KEY);
    if (existing) return existing;
    const next = window.crypto.randomUUID();
    window.sessionStorage.setItem(CHECKOUT_KEY, next);
    return next;
  }

  const estimate = useMemo(() => {
    const lines = bag.lines.filter((line) => line.variantId);
    if (lines.length === 0) return null;
    return quoteCheckout(
      lines.map((line) => ({
        variantId: line.variantId ?? line.productId,
        name: line.name ?? "Piece",
        sku: line.sku ?? "",
        size: line.size ?? "",
        color: line.color,
        quantity: line.quantity,
        unitPriceInPaise: line.priceInPaise ?? 0,
        compareAtPriceInPaise: line.compareAtPriceInPaise,
        stockQuantity: Math.max(line.quantity, line.stockHint ?? line.quantity),
        available: true,
      })),
      null,
    );
  }, [bag.lines]);

  const summary = couponQuote ?? (estimate?.ok ? estimate.quote : null);

  async function applyCoupon(form: HTMLFormElement) {
    setCheckingCoupon(true);
    setError("");
    const code = String(new FormData(form).get("coupon") ?? "");
    const result = await previewCouponAction(
      catalogueLines.flatMap((line) => (line.variantId ? [{ variantId: line.variantId, quantity: line.quantity }] : [])),
      code,
    );
    setCheckingCoupon(false);
    if (result.error || !result.quote) {
      setCouponQuote(null);
      setError(result.error ?? "That coupon could not be checked.");
      return;
    }
    setCouponQuote(result.quote);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canOrder || pending) return;
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    form.set("idempotencyKey", checkoutKey());
    form.set(
      "items",
      JSON.stringify(catalogueLines.flatMap((line) => (line.variantId ? [{ variantId: line.variantId, quantity: line.quantity }] : []))),
    );
    const result = await createCheckoutOrderAction(form);
    if (result.error || !result.reference) {
      setPending(false);
      setError(result.error ?? "The order could not be placed. No payment was taken.");
      return;
    }
    const ordered = new Set(catalogueLines.map((line) => line.variantId));
    replaceBag(currentBagLines().filter((line) => !line.variantId || !ordered.has(line.variantId)));
    window.sessionStorage.removeItem(CHECKOUT_KEY);
    router.push(`/order/${result.reference}`);
  }

  if (bag.lines.length === 0) {
    return (
      <Container className="py-12">
        <h1 className="font-display text-5xl">Checkout</h1>
        <p className="mt-4 max-w-md text-sm leading-6">Your bag is empty. Nothing is reserved.</p>
        <Link href="/shop" className="mt-6 inline-flex h-12 items-center bg-ink px-6 text-[11px] tracking-[0.16em] text-ivory uppercase">Continue shopping</Link>
      </Container>
    );
  }

  return (
    <Container className="py-10 md:py-14">
      <h1 className="font-display text-5xl md:text-6xl">Checkout</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-charcoal">
        {canOrder
          ? "The order is created unpaid. Opening the confirmation page does not take payment or mark it paid."
          : "Supabase is not configured, so an order cannot be created. No payment will be taken."}
      </p>
      <form onSubmit={onSubmit} className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <fieldset className="space-y-4">
            <legend className="text-[11px] tracking-[0.18em] uppercase">Contact</legend>
            <label className="block text-[11px] tracking-[0.14em] uppercase" htmlFor="fullName">
              Name
              <input id="fullName" name="fullName" autoComplete="name" required defaultValue={profile?.fullName ?? ""} className={fieldClass} />
            </label>
            <label className="block text-[11px] tracking-[0.14em] uppercase" htmlFor="phone">
              Mobile
              <input id="phone" name="phone" autoComplete="tel" inputMode="numeric" required pattern="[6-9][0-9]{9}" className={fieldClass} />
            </label>
            <label className="block text-[11px] tracking-[0.14em] uppercase" htmlFor="email">
              Email
              <input id="email" name="email" type="email" autoComplete="email" required defaultValue={profile?.email ?? ""} className={fieldClass} />
            </label>
          </fieldset>
          <fieldset className="space-y-4">
            <legend className="text-[11px] tracking-[0.18em] uppercase">Delivery</legend>
            {addresses.length > 0 ? (
              <label className="block text-[11px] tracking-[0.14em] uppercase" htmlFor="addressId">
                Address
                <select id="addressId" name="addressId" value={addressId} onChange={(event) => setAddressId(event.target.value)} className={fieldClass}>
                  {addresses.map((address) => (
                    <option key={address.id} value={address.id}>{address.fullName}, {address.line1}, {address.city} {address.postalCode}</option>
                  ))}
                  <option value="new">New address</option>
                </select>
              </label>
            ) : (
              <input type="hidden" name="addressId" value="new" />
            )}
            {addressId === "new" ? (
              <>
                <label className="block text-[11px] tracking-[0.14em] uppercase" htmlFor="line1">
                  Address
                  <input id="line1" name="line1" autoComplete="address-line1" required className={fieldClass} />
                </label>
                <label className="block text-[11px] tracking-[0.14em] uppercase" htmlFor="landmark">
                  Landmark, optional
                  <input id="landmark" name="landmark" autoComplete="address-line2" className={fieldClass} />
                </label>
                <label className="block text-[11px] tracking-[0.14em] uppercase" htmlFor="city">
                  City
                  <input id="city" name="city" autoComplete="address-level2" required className={fieldClass} />
                </label>
                <label className="block text-[11px] tracking-[0.14em] uppercase" htmlFor="state">
                  State
                  <select id="state" name="state" required defaultValue="" className={fieldClass}>
                    <option value="" disabled>Choose a state</option>
                    {indianStates.map((state) => <option key={state} value={state}>{state}</option>)}
                  </select>
                </label>
                <label className="block text-[11px] tracking-[0.14em] uppercase" htmlFor="postalCode">
                  PIN code
                  <input id="postalCode" name="postalCode" autoComplete="postal-code" inputMode="numeric" required pattern="[1-9][0-9]{5}" className={fieldClass} />
                </label>
              </>
            ) : null}
          </fieldset>
          <fieldset className="space-y-3">
            <legend className="text-[11px] tracking-[0.18em] uppercase">Payment</legend>
            {razorpayReady ? (
              <label className="flex min-h-12 items-center gap-3 text-sm">
                <input type="radio" name="paymentMethod" value="razorpay" defaultChecked required />
                Razorpay
              </label>
            ) : (
              <input type="hidden" name="paymentMethod" value="unconfigured" />
            )}
            <p className="text-sm leading-6 text-charcoal">
              {razorpayReady
                ? "Razorpay is the configured gateway. This step does not open a payment or mark the order paid."
                : "Online payment is not configured. Placing the order reserves catalogue stock and leaves the order unpaid."}
            </p>
          </fieldset>
          <label className="flex min-h-12 items-start gap-3 text-sm leading-6">
            <input name="terms" type="checkbox" required className="mt-1" />
            <span>
              I agree to the <Link className="underline" href="/terms">terms</Link>, <Link className="underline" href="/privacy">privacy policy</Link>, <Link className="underline" href="/shipping">shipping</Link>, and <Link className="underline" href="/returns">returns</Link>.
            </span>
          </label>
          {error ? <p role="alert" className="text-sm">{error}</p> : null}
          <button type="submit" disabled={!canOrder || pending || catalogueLines.length === 0 || sampleLines.length > 0} className="h-12 w-full bg-ink text-[11px] tracking-[0.16em] text-ivory uppercase disabled:bg-stone">
            {pending ? "Placing order" : "Place unpaid order"}
          </button>
          {!canOrder ? <p className="text-sm">Add the Supabase URL, anon key, and server key before an order can be created.</p> : null}
          {sampleLines.length > 0 ? <p className="text-sm">Remove sample pieces from the bag before checkout. They are not catalogue stock.</p> : null}
        </div>
        <aside className="h-fit border border-line p-6 lg:sticky lg:top-24">
          <h2 className="text-[11px] tracking-[0.18em] uppercase">Order summary</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {bag.lines.map((line) => (
              <li key={`${line.productId}-${line.size}-${line.color}`} className="py-3 text-sm">
                <p>{line.name}</p>
                <p className="text-xs text-stone">{line.color}{line.size ? ` · Size ${line.size}` : ""}{line.sku ? ` · ${line.sku}` : ""} · Qty {line.quantity}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <label className="block flex-1 text-[11px] tracking-[0.14em] uppercase" htmlFor="coupon">
              Coupon
              <input id="coupon" name="coupon" autoComplete="off" className={fieldClass} />
            </label>
            <button type="button" className="mt-6 h-12 border border-ink px-4 text-[11px] tracking-[0.14em] uppercase" disabled={checkingCoupon || catalogueLines.length === 0} onClick={(event) => void applyCoupon(event.currentTarget.form!)}>
              {checkingCoupon ? "Checking" : "Apply"}
            </button>
          </div>
          {summary ? <div className="mt-6"><OrderTotals {...summary} /></div> : <p className="mt-6 text-sm">The payable amount is calculated when the order is created.</p>}
          <p className="mt-4 text-xs leading-5 text-stone">Bag prices are an estimate. The order uses current catalogue prices, stock, shipping, and tax.</p>
        </aside>
      </form>
    </Container>
  );
}
