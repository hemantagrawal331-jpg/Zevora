"use client";

import Link from "next/link";
import { useState } from "react";
import { FashionImage } from "@/components/fashion-image";
import { HeartIcon } from "@/components/icons";
import { Price } from "@/components/price";
import { addToBag, useWishlist } from "@/components/store";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const wishlist = useWishlist();
  const wished = wishlist.has(product.id);
  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [notice, setNotice] = useState("");

  function add(size: string | null) {
    addToBag({ productId: product.id, color, size, quantity: 1 });
    setNotice(`${product.name} added to bag`);
    window.setTimeout(() => setNotice(""), 1600);
  }

  return (
    <article className="group">
      <div className="relative bg-sand">
        <Link href={`/product/${product.slug}`} className="block">
          <div className="relative aspect-[3/4] overflow-hidden">
            <FashionImage
              src={product.image}
              alt={product.imageAlt}
              fit={product.imageFit}
              sizes="(max-width: 768px) 50vw, 25vw"
              className="transition-transform duration-700 ease-out group-hover:scale-[1.035] motion-reduce:transform-none"
            />
          </div>
        </Link>
        <button
          type="button"
          aria-pressed={wished}
          aria-label={
            wished
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          onClick={() => wishlist.toggleWishlist(product.id)}
          className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center bg-ivory/90 text-ink hover:bg-ivory"
        >
          <HeartIcon filled={wished} className="h-4 w-4" />
        </button>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden translate-y-2 bg-ivory/95 opacity-0 transition duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 md:block">
          <QuickAdd product={product} onAdd={add} />
        </div>
      </div>
      <div className="pt-3">
        <h3 className="text-sm leading-5">
          <Link href={`/product/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="mt-0.5 text-xs tracking-wide text-stone">{product.descriptor}</p>
        <Price
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          className="mt-1.5"
        />
        {product.colors.length > 0 ? (
          <ul className="mt-3 flex items-center gap-2" aria-label="Colours">
            {product.colors.map((swatch) => {
              const selected = swatch.name === color;
              return (
                <li key={swatch.name}>
                  <button
                    type="button"
                    aria-label={swatch.name}
                    aria-pressed={selected}
                    onClick={() => setColor(swatch.name)}
                    className={`h-3.5 w-3.5 rounded-full border ${
                      selected ? "border-ink ring-1 ring-ink ring-offset-2" : "border-line"
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                  />
                </li>
              );
            })}
          </ul>
        ) : null}
        <div className="mt-3 md:hidden">
          <QuickAdd product={product} onAdd={add} />
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {notice}
      </p>
    </article>
  );
}

function QuickAdd({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (size: string | null) => void;
}) {
  if (product.sizes.length === 0) {
    return (
      <button
        type="button"
        onClick={() => onAdd(null)}
        className="w-full border-t border-line py-2.5 text-[11px] tracking-[0.16em] uppercase hover:bg-ink hover:text-ivory"
      >
        Add to bag
      </button>
    );
  }

  return (
    <ul className="grid grid-cols-5 border-t border-line">
      {product.sizes.map((size) => (
        <li key={size}>
          <button
            type="button"
            onClick={() => onAdd(size)}
            className="w-full py-2.5 text-[11px] tracking-[0.12em] hover:bg-ink hover:text-ivory"
            aria-label={`Add size ${size} to bag`}
          >
            {size}
          </button>
        </li>
      ))}
    </ul>
  );
}
