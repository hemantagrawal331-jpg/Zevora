"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { Container } from "@/components/container";
import { FashionImage } from "@/components/fashion-image";
import { removeFromBag, setBagQuantity, useBag } from "@/components/store";
import { placeOrderAction, syncCartAction } from "@/lib/commerce/actions";
import { getProductById } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { mainImage, sizeStock } from "@/lib/products";

export function BagView({
  signedIn = false,
  addresses = [],
}: {
  signedIn?: boolean;
  addresses?: { id: string; label: string }[];
}) {
  const bag = useBag();
  const [orderState, placeOrder, placing] = useActionState(placeOrderAction, {});
  const rows = bag.lines.map((line) => ({
    line,
    product: getProductById(line.productId),
  }));
  const subtotal = rows.reduce((total, row) => {
    const price = row.product?.priceInPaise ?? row.line.priceInPaise ?? 0;
    return total + price * row.line.quantity;
  }, 0);
  const orderable = rows.length > 0 && rows.every((row) => row.line.variantId);

  useEffect(() => {
    if (!signedIn) return;
    const items = bag.lines.flatMap((line) =>
      line.variantId ? [{ variantId: line.variantId, quantity: line.quantity }] : [],
    );
    void syncCartAction(items);
  }, [signedIn, bag.lines]);

  return (
    <Container className="py-10 md:py-14">
      <h1 className="font-display text-5xl md:text-6xl">Bag</h1>
      {bag.lines.length === 0 ? (
        <div className="mt-12 max-w-md border border-line px-6 py-16">
          <p className="font-display text-3xl">Your bag is empty</p>
          <p className="mt-3 text-sm leading-6 text-charcoal">
            Pieces you add will wait here. Nothing is reserved.
          </p>
          <Link
            href="/new-arrivals"
            className="mt-6 inline-flex h-11 items-center bg-ink px-6 text-[11px] tracking-[0.16em] text-ivory uppercase"
          >
            Shop new arrivals
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_0.6fr]">
          <ul className="divide-y divide-line border-y border-line">
            {rows.map(({ line, product }) => {
              const image = product ? mainImage(product, line.color) : null;
              const stock = product && line.size ? sizeStock(product, line.size, line.color) : (line.stockHint ?? line.quantity);
              const price = product?.priceInPaise ?? line.priceInPaise ?? 0;
              const name = product?.name ?? line.name;
              const quantities = Array.from(
                { length: Math.max(line.quantity, Math.min(5, stock || line.quantity)) },
                (_, index) => index + 1,
              );
              return (
              <li key={`${line.productId}-${line.color}-${line.size ?? "one"}`} className="flex gap-4 py-6">
                <div className="relative h-36 w-28 shrink-0 bg-sand">
                  {image || line.imageSrc ? (
                    <FashionImage
                      src={image?.src || line.imageSrc || ""}
                      alt={image?.alt || line.imageAlt || name || "Product"}
                      fit={image?.fit}
                      sizes="112px"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col">
                  {name ? (
                    <>
                      {product ? (
                        <Link href={`/product/${product.slug}`} className="text-sm hover:underline">
                          {name}
                        </Link>
                      ) : (
                        <p className="text-sm">{name}</p>
                      )}
                      <p className="mt-1 text-xs text-stone">
                        {line.color}
                        {line.size ? ` · Size ${line.size}` : ""}
                      </p>
                      <p className="mt-2 text-sm">{formatPrice(price)}</p>
                    </>
                  ) : (
                    <p className="text-sm">This piece is no longer in the edit.</p>
                  )}
                  <div className="mt-auto flex items-center gap-4 pt-4">
                    <label className="text-[11px] tracking-[0.14em] uppercase">
                      Qty
                      <select
                        aria-label={`Quantity for ${name ?? "item"}`}
                        value={line.quantity}
                        onChange={(event) =>
                          setBagQuantity(
                            line.productId,
                            line.color,
                            line.size,
                            Number(event.target.value),
                          )
                        }
                        className="ml-2 bg-transparent text-sm"
                      >
                        {quantities.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeFromBag(line.productId, line.color, line.size)}
                      className="text-[11px] tracking-[0.14em] uppercase underline"
                    >
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
            <div className="mt-6 flex items-baseline justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-4 text-xs leading-5 text-stone">
              Complimentary shipping applies above ₹5,000 once an order is placed. Payment is not taken here.
            </p>
            {orderable && signedIn ? (
              <form action={placeOrder} className="mt-6 space-y-3">
                <input type="hidden" name="items" value={JSON.stringify(rows.map((row) => ({ variantId: row.line.variantId, quantity: row.line.quantity })))} />
                <label className="block text-[11px] tracking-[0.14em] uppercase">
                  Address
                  <select name="addressId" className="mt-2 w-full border border-line bg-transparent px-3 py-2 text-sm" required>
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>{address.label}</option>
                    ))}
                  </select>
                </label>
                {addresses.length === 0 ? <p className="text-sm">Save an address in your account before placing an order.</p> : null}
                <button type="submit" disabled={placing || addresses.length === 0} className="h-12 w-full bg-ink text-[11px] tracking-[0.16em] text-ivory uppercase disabled:bg-stone">
                  {placing ? "Placing order" : "Place order"}
                </button>
              </form>
            ) : (
              <button type="button" disabled className="mt-6 h-12 w-full cursor-not-allowed border border-line text-[11px] tracking-[0.16em] text-stone uppercase">
                Checkout is not available
              </button>
            )}
            <p className="mt-3 text-xs leading-5 text-stone" role="status">
              {orderState.error || orderState.message || "Payments are not connected. A placed order stays pending until a verified payment event arrives."}
            </p>
          </aside>
        </div>
      )}
    </Container>
  );
}
