"use client";

import Link from "next/link";
import { Container } from "@/components/container";
import { FashionImage } from "@/components/fashion-image";
import { removeFromBag, setBagQuantity, useBag } from "@/components/store";
import { getProductById } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

export function BagView() {
  const bag = useBag();
  const rows = bag.lines.map((line) => ({
    line,
    product: getProductById(line.productId),
  }));
  const subtotal = rows.reduce((total, row) => {
    if (!row.product) return total;
    return total + row.product.price * row.line.quantity;
  }, 0);

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
            {rows.map(({ line, product }) => (
              <li key={`${line.productId}-${line.color}-${line.size ?? "one"}`} className="flex gap-4 py-6">
                <div className="relative h-36 w-28 shrink-0 bg-sand">
                  {product ? (
                    <FashionImage
                      src={product.image}
                      alt={product.imageAlt}
                      fit={product.imageFit}
                      sizes="112px"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col">
                  {product ? (
                    <>
                      <Link href={`/product/${product.slug}`} className="text-sm hover:underline">
                        {product.name}
                      </Link>
                      <p className="mt-1 text-xs text-stone">
                        {line.color}
                        {line.size ? ` · Size ${line.size}` : ""}
                      </p>
                      <p className="mt-2 text-sm">{formatPrice(product.price)}</p>
                    </>
                  ) : (
                    <p className="text-sm">This piece is no longer in the edit.</p>
                  )}
                  <div className="mt-auto flex items-center gap-4 pt-4">
                    <label className="text-[11px] tracking-[0.14em] uppercase">
                      Qty
                      <select
                        aria-label={`Quantity for ${product?.name ?? "item"}`}
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
                        {[1, 2, 3, 4, 5].map((value) => (
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
            ))}
          </ul>
          <aside className="h-fit border border-line p-6">
            <h2 className="text-[11px] tracking-[0.18em] uppercase">Summary</h2>
            <div className="mt-6 flex items-baseline justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-4 text-xs leading-5 text-stone">
              Shipping is calculated when checkout exists. Complimentary shipping is noted above ₹5,000.
            </p>
            <button
              type="button"
              disabled
              className="mt-6 h-12 w-full cursor-not-allowed border border-line text-[11px] tracking-[0.16em] text-stone uppercase"
            >
              Checkout is not available
            </button>
            <p className="mt-3 text-xs leading-5 text-stone">
              Payments are not connected. This bag is saved in your browser only.
            </p>
          </aside>
        </div>
      )}
    </Container>
  );
}
