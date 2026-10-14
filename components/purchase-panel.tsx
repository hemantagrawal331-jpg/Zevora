"use client";

import { useState } from "react";
import { HeartIcon } from "@/components/icons";
import { Price } from "@/components/price";
import { addToBag, useWishlist } from "@/components/store";
import type { Product } from "@/lib/products";

export function PurchasePanel({ product }: { product: Product }) {
  const wishlist = useWishlist();
  const wished = wishlist.has(product.id);
  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function onAdd() {
    if (product.sizes.length > 0 && !size) {
      setError("Select a size.");
      setNotice("");
      return;
    }
    addToBag({
      productId: product.id,
      color,
      size: product.sizes.length > 0 ? size : null,
      quantity,
    });
    setError("");
    setNotice("Added to bag");
  }

  return (
    <div>
      <Price price={product.price} compareAtPrice={product.compareAtPrice} className="text-base" />
      <fieldset className="mt-8">
        <legend className="text-[11px] tracking-[0.16em] uppercase">Colour · {color}</legend>
        <p className="mt-2 text-xs text-stone">Photograph shows {product.colors[0]?.name}.</p>
        <ul className="mt-4 flex gap-3">
          {product.colors.map((swatch) => {
            const selected = swatch.name === color;
            return (
              <li key={swatch.name}>
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={swatch.name}
                  onClick={() => setColor(swatch.name)}
                  className={`h-5 w-5 rounded-full border ${
                    selected ? "border-ink ring-1 ring-ink ring-offset-2" : "border-line"
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                />
              </li>
            );
          })}
        </ul>
      </fieldset>
      {product.sizes.length > 0 ? (
        <fieldset className="mt-8">
          <legend className="text-[11px] tracking-[0.16em] uppercase">Size</legend>
          <ul className="mt-4 grid grid-cols-5 gap-2">
            {product.sizes.map((option) => {
              const selected = option === size;
              return (
                <li key={option}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setSize(option);
                      setError("");
                    }}
                    className={`h-11 w-full border text-sm ${
                      selected ? "border-ink bg-ink text-ivory" : "border-line hover:border-ink"
                    }`}
                  >
                    {option}
                  </button>
                </li>
              );
            })}
          </ul>
          {error ? (
            <p className="mt-3 text-sm" role="alert">
              {error}
            </p>
          ) : null}
        </fieldset>
      ) : (
        <p className="mt-8 text-sm text-charcoal">One size.</p>
      )}
      <div className="mt-8 flex items-center gap-4">
        <label className="text-[11px] tracking-[0.16em] uppercase">
          Qty
          <select
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            className="ml-3 bg-transparent py-2 text-sm"
            aria-label="Quantity"
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onAdd}
          className="h-12 flex-1 bg-ink text-[11px] tracking-[0.18em] text-ivory uppercase hover:bg-charcoal"
        >
          Add to bag
        </button>
        <button
          type="button"
          aria-pressed={wished}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          onClick={() => wishlist.toggleWishlist(product.id)}
          className="flex h-12 w-12 items-center justify-center border border-ink"
        >
          <HeartIcon filled={wished} className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-3 text-sm" role="status">
        {notice}
      </p>
      <p className="mt-6 text-sm leading-7 text-charcoal">{product.description}</p>
      <ul className="mt-4 space-y-1 text-sm text-charcoal">
        {product.details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
    </div>
  );
}
