"use client";

import Link from "next/link";
import { Container } from "@/components/container";
import { ProductGrid } from "@/components/product-grid";
import { useWishlist } from "@/components/store";
import { getProductById } from "@/lib/catalog";

export function WishlistView() {
  const wishlist = useWishlist();
  const products = wishlist.ids
    .map((id) => getProductById(id))
    .filter((product) => product !== undefined);

  return (
    <Container className="py-10 md:py-14">
      <h1 className="font-display text-5xl md:text-6xl">Wishlist</h1>
      <p className="mt-3 text-sm text-charcoal">Saved on this device.</p>
      {products.length === 0 ? (
        <div className="mt-12 max-w-md border border-line px-6 py-16">
          <p className="font-display text-3xl">Nothing saved</p>
          <p className="mt-3 text-sm leading-6 text-charcoal">
            Use the heart on a piece to keep it here.
          </p>
          <Link
            href="/new-arrivals"
            className="mt-6 inline-flex h-11 items-center bg-ink px-6 text-[11px] tracking-[0.16em] text-ivory uppercase"
          >
            Shop new arrivals
          </Link>
        </div>
      ) : (
        <div className="mt-10">
          <ProductGrid products={products} />
        </div>
      )}
    </Container>
  );
}
