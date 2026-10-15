"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRef } from "react";
import { Container } from "@/components/container";
import { ProductGrid } from "@/components/product-grid";
import { getCategory, subcategoryLabel, type CategoryId } from "@/lib/categories";
import { PAGE_SIZE, parseCatalogFilters, queryCatalog, type SortKey } from "@/lib/catalog";
import type { Product } from "@/lib/products";

const sorts: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popularity", label: "Popularity" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
];

export function CatalogView({
  eyebrow,
  title,
  description,
  products,
  requireQuery = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  products: Product[];
  requireQuery?: boolean;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const filters = parseCatalogFilters({
    q: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? searchParams.get("department") ?? undefined,
    subcategory: searchParams.get("subcategory") ?? undefined,
    size: searchParams.get("size") ?? undefined,
    color: searchParams.get("color") ?? undefined,
    availability: searchParams.get("availability") ?? undefined,
    min: searchParams.get("min") ?? undefined,
    max: searchParams.get("max") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    page: searchParams.get("page") ?? undefined,
  });
  const categoriesInView = [...new Set(products.map((product) => product.category))];
  const subcategorySource = filters.category ? products.filter((product) => product.category === filters.category) : products;
  const subcategoriesInView = [...new Set(subcategorySource.map((product) => product.subcategory))];
  const multiCategory = categoriesInView.length > 1;
  const multiSubcategory = subcategoriesInView.length > 1;
  const applied = queryCatalog(products, {
    ...filters,
    category: multiCategory ? filters.category : null,
    subcategory: multiSubcategory ? filters.subcategory : null,
    pageSize: PAGE_SIZE,
  });
  const sizes = unique(products.flatMap((product) => product.sizes.map((size) => size.label)));
  const colors = uniqueColors(products);
  const active = activeFilters(filters, multiCategory, multiSubcategory);
  const waitingForQuery = requireQuery && !filters.query;

  function write(updates: Record<string, string | null>, keepPage = false) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    if (!keepPage) next.delete("page");
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function toggleList(key: "size" | "color", value: string, current: string[]) {
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    write({ [key]: next.join(",") || null });
  }

  function clearAll() {
    write({
      q: null,
      category: null,
      department: null,
      subcategory: null,
      size: null,
      color: null,
      availability: null,
      min: null,
      max: null,
      sort: null,
      page: null,
    });
  }

  const start = applied.total === 0 ? 0 : (applied.page - 1) * applied.pageSize + 1;
  const end = Math.min(applied.total, applied.page * applied.pageSize);

  return (
    <>
      <header className="border-b border-line">
        <Container className="py-10 md:py-14">
          {eyebrow ? <p className="text-[11px] tracking-[0.22em] text-stone uppercase">{eyebrow}</p> : null}
          <h1 className="mt-2 font-display text-5xl leading-none md:text-6xl">
            {requireQuery && filters.query ? `“${filters.query}”` : title}
          </h1>
          {description ? <p className="mt-4 max-w-xl text-sm leading-6 text-charcoal">{description}</p> : null}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-[11px] tracking-[0.16em] text-stone uppercase">
              {waitingForQuery ? "Search" : `${applied.total} ${applied.total === 1 ? "piece" : "pieces"}`}
              {applied.total > applied.pageSize ? ` · ${start}–${end}` : ""}
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="h-10 border border-ink px-4 text-[11px] tracking-[0.16em] uppercase lg:hidden"
                onClick={() => dialogRef.current?.showModal()}
              >
                Filters{active.length > 0 ? ` (${active.length})` : ""}
              </button>
              <label className="text-[11px] tracking-[0.16em] uppercase">
                <span className="sr-only">Sort</span>
                <select
                  value={filters.sort}
                  onChange={(event) => write({ sort: event.target.value === "newest" ? null : event.target.value })}
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
          </div>
          {active.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Active filters">
              {active.map((chip) => (
                <li key={chip.key}>
                  <button
                    type="button"
                    onClick={() => write(chip.clear)}
                    className="border border-line px-3 py-1 text-[11px] tracking-[0.12em] uppercase"
                  >
                    {chip.label} ×
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={clearAll} className="px-3 py-1 text-[11px] tracking-[0.12em] uppercase">
                  Clear all
                </button>
              </li>
            </ul>
          ) : null}
        </Container>
      </header>
      <Container className="grid gap-10 py-8 lg:grid-cols-[16rem_1fr] lg:py-12">
        <div className="hidden lg:block">
          <FilterFields
            group="desktop"
            filters={filters}
            categories={multiCategory ? categoriesInView : []}
            subcategories={multiSubcategory ? subcategoriesInView : []}
            sizes={sizes}
            colors={colors}
            onWrite={write}
            onToggle={toggleList}
          />
        </div>
        <div>
          {waitingForQuery ? (
            <p className="text-sm text-charcoal">Search by a product name, a category, or a word such as denim or hoodie.</p>
          ) : applied.total === 0 ? (
            <div className="border border-line px-6 py-16">
              <p className="font-display text-3xl">No pieces match</p>
              <p className="mt-3 max-w-md text-sm leading-6 text-charcoal">
                Nothing in this edit matches the current filters.
              </p>
              {active.length > 0 ? (
                <button type="button" onClick={clearAll} className="mt-6 text-[11px] tracking-[0.16em] uppercase">
                  Clear all filters
                </button>
              ) : null}
            </div>
          ) : (
            <ProductGrid products={applied.products} />
          )}
          {applied.pageCount > 1 ? (
            <nav className="mt-10 flex items-center justify-between text-sm" aria-label="Pagination">
              {applied.page > 1 ? (
                <button type="button" onClick={() => write({ page: applied.page === 2 ? null : String(applied.page - 1) }, true)} className="text-[11px] tracking-[0.16em] uppercase">
                  Previous
                </button>
              ) : (
                <span />
              )}
              <p>
                Page {applied.page} of {applied.pageCount}
              </p>
              {applied.page < applied.pageCount ? (
                <button type="button" onClick={() => write({ page: String(applied.page + 1) }, true)} className="text-[11px] tracking-[0.16em] uppercase">
                  Next
                </button>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </div>
      </Container>
      <dialog ref={dialogRef} className="w-[min(100%,24rem)] border border-line bg-ivory p-6 backdrop:bg-ink/40">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] tracking-[0.16em] uppercase">Filters</h2>
          <button type="button" onClick={() => dialogRef.current?.close()} className="text-[11px] tracking-[0.16em] uppercase">
            Close
          </button>
        </div>
        <div className="mt-6">
          <FilterFields
            group="mobile"
            filters={filters}
            categories={multiCategory ? categoriesInView : []}
            subcategories={multiSubcategory ? subcategoriesInView : []}
            sizes={sizes}
            colors={colors}
            onWrite={(updates) => {
              write(updates);
            }}
            onToggle={toggleList}
          />
        </div>
        <button type="button" onClick={() => dialogRef.current?.close()} className="mt-8 h-11 w-full bg-ink text-[11px] tracking-[0.16em] text-ivory uppercase">
          Show {applied.total} {applied.total === 1 ? "piece" : "pieces"}
        </button>
      </dialog>
    </>
  );
}

function FilterFields({
  group,
  filters,
  categories,
  subcategories,
  sizes,
  colors,
  onWrite,
  onToggle,
}: {
  group: string;
  filters: ReturnType<typeof parseCatalogFilters>;
  categories: CategoryId[];
  subcategories: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  onWrite: (updates: Record<string, string | null>) => void;
  onToggle: (key: "size" | "color", value: string, current: string[]) => void;
}) {
  return (
    <div className="space-y-8">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const value = String(new FormData(event.currentTarget).get("q") ?? "").trim();
          onWrite({ q: value || null });
        }}
      >
        <label htmlFor={`${group}-search`} className="text-[11px] tracking-[0.16em] uppercase">
          Search
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id={`${group}-search`}
            name="q"
            key={filters.query}
            defaultValue={filters.query}
            className="w-full border border-line bg-transparent px-3 py-2 outline-none"
          />
          <button type="submit" className="px-3 text-[11px] tracking-[0.14em] uppercase">
            Search
          </button>
        </div>
      </form>
      {categories.length > 0 ? (
        <fieldset>
          <legend className="text-[11px] tracking-[0.16em] uppercase">Department</legend>
          <ul className="mt-3 space-y-2">
            {categories.map((category) => (
              <li key={category}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`${group}-category`}
                    checked={filters.category === category}
                    onChange={() => onWrite({ category, subcategory: null })}
                  />
                  {getCategory(category)?.label}
                </label>
              </li>
            ))}
            <li>
              <button type="button" onClick={() => onWrite({ category: null, subcategory: null })} className="text-sm text-charcoal">
                All departments
              </button>
            </li>
          </ul>
        </fieldset>
      ) : null}
      {subcategories.length > 0 ? (
        <fieldset>
          <legend className="text-[11px] tracking-[0.16em] uppercase">Category</legend>
          <ul className="mt-3 space-y-2">
            {subcategories.map((slug) => {
              const category = filters.category ?? categories[0] ?? "men";
              const label = subcategoryLabel(category, slug) === slug ? labelFromAny(slug) : subcategoryLabel(category, slug);
              return (
                <li key={slug}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.subcategory === slug}
                      onChange={() => onWrite({ subcategory: filters.subcategory === slug ? null : slug })}
                    />
                    {label}
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ) : null}
      {sizes.length > 0 ? (
        <fieldset>
          <legend className="text-[11px] tracking-[0.16em] uppercase">Size</legend>
          <ul className="mt-3 flex flex-wrap gap-2">
            {sizes.map((size) => {
              const selected = filters.sizes.includes(size);
              return (
                <li key={size}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onToggle("size", size, filters.sizes)}
                    className={`h-10 min-w-10 border px-2 text-sm ${selected ? "border-ink bg-ink text-ivory" : "border-line"}`}
                  >
                    {size}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ) : null}
      {colors.length > 0 ? (
        <fieldset>
          <legend className="text-[11px] tracking-[0.16em] uppercase">Colour</legend>
          <ul className="mt-3 flex flex-wrap gap-3">
            {colors.map((color) => {
              const selected = filters.colors.includes(color.name);
              return (
                <li key={color.name}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    aria-label={color.name}
                    onClick={() => onToggle("color", color.name, filters.colors)}
                    className={`h-5 w-5 rounded-full border ${selected ? "border-ink ring-1 ring-ink ring-offset-2" : "border-line"}`}
                    style={{ backgroundColor: color.hex }}
                  />
                </li>
              );
            })}
          </ul>
        </fieldset>
      ) : null}
      <fieldset>
        <legend className="text-[11px] tracking-[0.16em] uppercase">Price, ₹</legend>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            onWrite({
              min: cleanRupee(String(data.get("min") ?? "")),
              max: cleanRupee(String(data.get("max") ?? "")),
            });
          }}
        >
          <input name="min" inputMode="numeric" defaultValue={filters.minPaise ? String(filters.minPaise / 100) : ""} key={`min-${filters.minPaise ?? ""}`} aria-label="Minimum price" placeholder="Min" className="w-full border border-line bg-transparent px-2 py-2" />
          <input name="max" inputMode="numeric" defaultValue={filters.maxPaise ? String(filters.maxPaise / 100) : ""} key={`max-${filters.maxPaise ?? ""}`} aria-label="Maximum price" placeholder="Max" className="w-full border border-line bg-transparent px-2 py-2" />
          <button type="submit" className="text-[11px] tracking-[0.14em] uppercase">
            Apply
          </button>
        </form>
      </fieldset>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.availability === "in-stock"}
          onChange={(event) => onWrite({ availability: event.target.checked ? "in-stock" : null })}
        />
        In stock only
      </label>
    </div>
  );
}

function activeFilters(
  filters: ReturnType<typeof parseCatalogFilters>,
  multiCategory: boolean,
  multiSubcategory: boolean,
) {
  const chips: { key: string; label: string; clear: Record<string, string | null> }[] = [];
  if (filters.query) chips.push({ key: "q", label: filters.query, clear: { q: null } });
  if (multiCategory && filters.category) {
    chips.push({ key: "category", label: getCategory(filters.category)?.label ?? filters.category, clear: { category: null } });
  }
  if (multiSubcategory && filters.subcategory) {
    chips.push({
      key: "subcategory",
      label: labelFromAny(filters.subcategory),
      clear: { subcategory: null },
    });
  }
  for (const size of filters.sizes) {
    chips.push({
      key: `size-${size}`,
      label: `Size ${size}`,
      clear: { size: filters.sizes.filter((item) => item !== size).join(",") || null },
    });
  }
  for (const color of filters.colors) {
    chips.push({
      key: `color-${color}`,
      label: color,
      clear: { color: filters.colors.filter((item) => item !== color).join(",") || null },
    });
  }
  if (filters.availability === "in-stock") chips.push({ key: "stock", label: "In stock", clear: { availability: null } });
  if (filters.minPaise) chips.push({ key: "min", label: `From ₹${filters.minPaise / 100}`, clear: { min: null } });
  if (filters.maxPaise) chips.push({ key: "max", label: `To ₹${filters.maxPaise / 100}`, clear: { max: null } });
  return chips;
}

function labelFromAny(slug: string) {
  return subcategoryLabel("men", slug) !== slug
    ? subcategoryLabel("men", slug)
    : subcategoryLabel("women", slug) !== slug
      ? subcategoryLabel("women", slug)
      : subcategoryLabel("accessories", slug);
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function uniqueColors(products: Product[]) {
  const seen = new Map<string, string>();
  for (const product of products) {
    for (const color of product.colors) {
      if (!seen.has(color.name)) seen.set(color.name, color.hex);
    }
  }
  return [...seen.entries()].map(([name, hex]) => ({ name, hex }));
}

function cleanRupee(value: string) {
  const trimmed = value.trim();
  return /^[1-9][0-9]*$/.test(trimmed) ? trimmed : null;
}
