"use client";

import Link from "next/link";
import { useState } from "react";
import { FashionImage } from "@/components/fashion-image";
import { HeartIcon } from "@/components/icons";
import { Price } from "@/components/price";
import { addToBag, useWishlist } from "@/components/store";
import { mainImage, productLabel, totalStock, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const wishlist = useWishlist();
  const wished = wishlist.has(product.id);
  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [notice, setNotice] = useState("");
  const image = mainImage(product, color);
  const stock = totalStock(product);

  function add(size: string) {
    const result = addToBag({ productId: product.id, color, size, quantity: 1 });
    setNotice(result.ok ? `${product.name} added to bag` : result.message);
    window.setTimeout(() => setNotice(""), 1600);
  }

  return (
    <article className="group">
      <div className="relative bg-sand">
        <Link href={`/product/${product.slug}`} className="block">
          <div className="relative aspect-[3/4] overflow-hidden">
            <FashionImage
              src={image.src}
              alt={image.alt}
              fit={image.fit}
              sizes="(max-width: 768px) 50vw, 25vw"
              className="transition-transform duration-700 ease-out group-hover:scale-[1.035] motion-reduce:transform-none"
            />
          </div>
        </Link>
        <button
          type="button"
          aria-pressed={wished}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
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
        <p className="mt-0.5 text-xs tracking-wide text-stone">{productLabel(product)}</p>
        <Price priceInPaise={product.priceInPaise} compareAtPriceInPaise={product.compareAtPriceInPaise} className="mt-1.5" />
        {stock === 0 ? <p className="mt-1 text-xs text-stone">Out of stock</p> : null}
        {product.colors.length > 1 ? (
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
                    className={`h-3.5 w-3.5 rounded-full border ${selected ? "border-ink ring-1 ring-ink ring-offset-2" : "border-line"}`}
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

function QuickAdd({ product, onAdd }: { product: Product; onAdd: (size: string) => void }) {
  if (product.sizes.length === 1) {
    const size = product.sizes[0];
    const unavailable = size.stockQuantity <= 0;
    return (
      <button
        type="button"
        disabled={unavailable}
        onClick={() => onAdd(size.label)}
        className="w-full border-t border-line py-2.5 text-[11px] tracking-[0.16em] uppercase hover:bg-ink hover:text-ivory disabled:text-stone"
      >
        {unavailable ? "Out of stock" : "Add to bag"}
      </button>
    );
  }

  return (
    <ul className="flex overflow-x-auto border-t border-line">
      {product.sizes.map((size) => {
        const unavailable = size.stockQuantity <= 0;
        return (
          <li key={size.label} className="min-w-12 flex-1">
            <button
              type="button"
              disabled={unavailable}
              onClick={() => onAdd(size.label)}
              className="w-full py-2.5 text-[11px] tracking-[0.12em] hover:bg-ink hover:text-ivory disabled:text-stone"
              aria-label={unavailable ? `Size ${size.label} is out of stock` : `Add size ${size.label} to bag`}
            >
              {size.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
