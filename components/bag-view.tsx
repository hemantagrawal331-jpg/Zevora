"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/container";
import { FashionImage } from "@/components/fashion-image";
import { OrderTotals } from "@/components/order-totals";
import { currentBagLines, removeFromBag, replaceBag, setBagQuantity, useBag, type BagLine } from "@/components/store";
import { applyMergedCart } from "@/lib/commerce/cart-merge";
import { mergeCartAction, type MergeResult } from "@/lib/commerce/checkout-actions";
import { syncCartAction } from "@/lib/commerce/actions";
import { quoteCheckout, type CheckoutQuote } from "@/lib/commerce/quote";
import { formatPrice } from "@/lib/format";

function persistSignedInCart(signedIn: boolean, ready: boolean) {
  if (!signedIn || !ready) return;
  const items = currentBagLines().flatMap((line) =>
    line.variantId ? [{ variantId: line.variantId, quantity: line.quantity }] : [],
  );
  void syncCartAction(items);
}

function estimateFor(lines: BagLine[]) {
  if (lines.length === 0) return null;
  return quoteCheckout(
    lines.map((line) => ({
      variantId: line.variantId ?? `${line.productId}-${line.size ?? "one"}-${line.color}`,
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
}

export function BagView({ signedIn = false }: { signedIn?: boolean }) {
  const bag = useBag();
  const merged = useRef(false);
  const [ready, setReady] = useState(!signedIn);
  const [notice, setNotice] = useState("");
  const rows = bag.lines;

  useEffect(() => {
    if (!signedIn || merged.current) return;
    merged.current = true;
    const guest = currentBagLines().flatMap((line) =>
      line.variantId ? [{ variantId: line.variantId, quantity: line.quantity }] : [],
    );
    void mergeCartAction(guest).then((result: MergeResult) => {
      if (!result.ok) {
        setNotice(result.message ?? "");
        setReady(true);
        return;
      }
      const remote: BagLine[] = result.lines.map((line) => ({ ...line, variantId: line.variantId }));
      replaceBag(applyMergedCart(currentBagLines(), remote));
      if (result.message) setNotice(result.message);
      setReady(true);
    });
  }, [signedIn]);

  const estimate = estimateFor(rows);
  const quote: CheckoutQuote | null = estimate?.ok ? estimate.quote : null;
  const orderable = rows.length > 0 && rows.every((line) => line.variantId);

  function changeQuantity(line: BagLine, quantity: number) {
    setBagQuantity(line.productId, line.color, line.size, quantity);
    persistSignedInCart(signedIn, ready);
  }

  return (
    <Container className="py-10 md:py-14">
      <h1 className="font-display text-5xl md:text-6xl">Bag</h1>
      {notice ? <p className="mt-4 max-w-xl text-sm text-charcoal" role="status">{notice}</p> : null}
      {rows.length === 0 ? (
        <div className="mt-12 max-w-md border border-line px-6 py-16">
          <p className="font-display text-3xl">Your bag is empty</p>
          <p className="mt-3 text-sm leading-6 text-charcoal">Pieces you add will wait here. Nothing is reserved until checkout.</p>
          <Link href="/shop" className="mt-6 inline-flex h-11 items-center bg-ink px-6 text-[11px] tracking-[0.16em] text-ivory uppercase">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_0.6fr]">
          <ul className="divide-y divide-line border-y border-line">
            {rows.map((line) => {
              const name = line.name ?? "Piece";
              const cap = line.stockHint === undefined ? 5 : Math.min(5, Math.max(0, line.stockHint));
              const price = line.priceInPaise ?? 0;
              return (
                <li key={`${line.productId}-${line.color}-${line.size ?? "one"}`} className="flex gap-4 py-6">
                  <div className="relative h-36 w-28 shrink-0 bg-sand">
                    <FashionImage src={line.imageSrc || ""} alt={line.imageAlt || name} sizes="112px" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm">{name}</p>
                    <p className="mt-1 text-xs text-stone">
                      {line.color}
                      {line.size ? ` · Size ${line.size}` : ""}
                      {line.sku ? ` · ${line.sku}` : ""}
                    </p>
                    <p className="mt-2 text-sm">{price > 0 ? formatPrice(price) : "Price confirmed at checkout"}</p>
                    {line.compareAtPriceInPaise && line.compareAtPriceInPaise > price ? (
                      <p className="text-xs text-stone">Was {formatPrice(line.compareAtPriceInPaise)}</p>
                    ) : null}
                    {!line.variantId ? <p className="mt-2 text-xs text-stone">Sample piece. It cannot be ordered.</p> : null}
                    <div className="mt-auto flex items-center gap-4 pt-4">
                      <div className="flex items-center border border-line">
                        <button type="button" className="h-11 w-11" aria-label={`Decrease quantity of ${name}`} disabled={line.quantity <= 1} onClick={() => changeQuantity(line, line.quantity - 1)}>−</button>
                        <span className="min-w-6 text-center text-sm" aria-live="polite">{line.quantity}</span>
                        <button type="button" className="h-11 w-11" aria-label={`Increase quantity of ${name}`} disabled={line.quantity >= cap} onClick={() => changeQuantity(line, line.quantity + 1)}>+</button>
                      </div>
                      <button type="button" onClick={() => { removeFromBag(line.productId, line.color, line.size); persistSignedInCart(signedIn, ready); }} className="text-[11px] tracking-[0.14em] uppercase underline">
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <aside className="h-fit border border-line p-6">
            <h2 className="text-[11px] tracking-[0.18em] uppercase">Summary</h2>
            {quote ? (
              <div className="mt-6">
                <OrderTotals {...quote} />
              </div>
            ) : (
              <p className="mt-6 text-sm" role="alert">{estimate && !estimate.ok ? estimate.message : "The total will be confirmed at checkout."}</p>
            )}
            <p className="mt-4 text-xs leading-5 text-stone">
              This is an estimate from the prices saved in your bag. Checkout checks the catalogue, stock, shipping, and tax. Nothing is reserved here.
            </p>
            <div className="mt-6 grid gap-3">
              <Link href="/shop" className="inline-flex h-12 items-center justify-center border border-ink text-[11px] tracking-[0.16em] uppercase">Continue shopping</Link>
              {orderable ? (
                <Link href="/checkout" className="inline-flex h-12 items-center justify-center bg-ink text-[11px] tracking-[0.16em] text-ivory uppercase">Checkout</Link>
              ) : (
                <p className="text-sm text-charcoal">Sample pieces stay in the bag, but only catalogue pieces can go to checkout.</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </Container>
  );
}
