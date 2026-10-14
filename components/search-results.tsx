"use client";

import { use } from "react";
import { Container } from "@/components/container";
import { ProductGrid } from "@/components/product-grid";
import { searchProducts } from "@/lib/catalog";

export function SearchResults({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = use(searchParams);
  const raw = params.q;
  const query = (Array.isArray(raw) ? raw[0] : raw ?? "").trim();
  const results = query ? searchProducts(query) : [];

  return (
    <Container className="py-10 md:py-14">
      <p className="text-[11px] tracking-[0.2em] text-stone uppercase">Search</p>
      <h1 className="mt-3 font-display text-5xl md:text-6xl">
        {query ? `“${query}”` : "Search the collection"}
      </h1>
      <form action="/search" className="mt-8 max-w-xl">
        <label htmlFor="search-query" className="text-[11px] tracking-[0.16em] uppercase">
          Search
        </label>
        <div className="mt-2 flex border-b border-ink">
          <input
            id="search-query"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Coats, knits, bags"
            className="h-12 w-full bg-transparent text-base outline-none"
          />
          <button type="submit" className="text-[11px] tracking-[0.16em] uppercase">
            Search
          </button>
        </div>
      </form>
      <div className="mt-12">
        {!query ? (
          <p className="text-sm text-charcoal">Try a fabric, a category, or a colour.</p>
        ) : results.length === 0 ? (
          <div className="max-w-md border border-line px-6 py-16">
            <p className="font-display text-3xl">No matches</p>
            <p className="mt-3 text-sm leading-6 text-charcoal">
              Nothing in the edit matches “{query}”. Try coat, knit, bag, or dress.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-8 text-[11px] tracking-[0.16em] text-stone uppercase">
              {results.length} {results.length === 1 ? "piece" : "pieces"}
            </p>
            <ProductGrid products={results} />
          </>
        )}
      </div>
    </Container>
  );
}
