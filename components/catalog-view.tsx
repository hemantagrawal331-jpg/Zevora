"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/container";
import { ProductGrid } from "@/components/product-grid";
import { sortProducts, type SortKey } from "@/lib/catalog";
import type { Product } from "@/lib/products";

const sorts: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "new", label: "New" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
];

export function CatalogView({
  eyebrow,
  title,
  description,
  products,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  products: Product[];
}) {
  const [sort, setSort] = useState<SortKey>("featured");
  const sorted = useMemo(() => sortProducts(products, sort), [products, sort]);

  return (
    <>
      <header className="border-b border-line">
        <Container className="flex flex-col gap-8 py-10 md:flex-row md:items-end md:justify-between md:py-14">
          <div className="max-w-2xl">
            {eyebrow ? (
              <p className="text-[11px] tracking-[0.22em] text-stone uppercase">{eyebrow}</p>
            ) : null}
            <h1 className="mt-2 font-display text-5xl leading-none md:text-6xl">{title}</h1>
            {description ? (
              <p className="mt-4 max-w-xl text-sm leading-6 text-charcoal">{description}</p>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-6 md:justify-end">
            <p className="text-[11px] tracking-[0.16em] text-stone uppercase">
              {products.length} {products.length === 1 ? "piece" : "pieces"}
            </p>
            <label className="text-[11px] tracking-[0.16em] uppercase">
              <span className="sr-only">Sort</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                className="bg-transparent py-1 text-[11px] tracking-[0.14em] uppercase"
              >
                {sorts.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Container>
      </header>
      <Container className="py-8 md:py-12">
        <ProductGrid products={sorted} />
      </Container>
    </>
  );
}
