"use client";

import { useActionState, useMemo, useState } from "react";
import { saveProductAction, type ActionState } from "@/lib/commerce/actions";
import { slugify } from "@/lib/commerce/product-input";

type CategoryOption = { id: string; name: string; department: string; slug: string };
type VariantRow = { size: string; color: string; hex: string; sku: string; price: string; compare: string; stock: string };

const inputClass = "mt-2 w-full border border-line bg-transparent px-3 py-2 outline-none";
const labelClass = "text-[11px] tracking-[0.16em] uppercase";

function emptyVariant(): VariantRow {
  return { size: "M", color: "Black", hex: "#171717", sku: "", price: "", compare: "", stock: "0" };
}

export function ProductForm({
  categories,
  product,
}: {
  categories: CategoryOption[];
  product?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    categoryId: string;
    department: string;
    material: string;
    fit: string;
    care: string;
    tags: string;
    isNewArrival: boolean;
    isBestseller: boolean;
    isActive: boolean;
    variants: VariantRow[];
  };
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveProductAction, {});
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [department, setDepartment] = useState(product?.department ?? "men");
  const [variants, setVariants] = useState<VariantRow[]>(product?.variants.length ? product.variants : [emptyVariant()]);
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const options = useMemo(() => categories.filter((category) => category.department === department), [categories, department]);
  const selectedCategory = options.some((category) => category.id === categoryId) ? categoryId : (options[0]?.id ?? "");

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariants((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  return (
    <form action={action} className="mt-8 max-w-3xl space-y-6">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />
      <AdminNotice state={state} />
      <label className={`block ${labelClass}`}>
        Name
        <input name="name" value={name} onChange={(event) => {
          setName(event.target.value);
          if (!product) setSlug(slugify(event.target.value));
        }} className={inputClass} required />
      </label>
      <label className={`block ${labelClass}`}>
        Slug
        <input name="slug" value={slug} onChange={(event) => setSlug(slugify(event.target.value))} className={inputClass} required />
      </label>
      <label className={`block ${labelClass}`}>
        Description
        <textarea name="description" defaultValue={product?.description} className={`${inputClass} min-h-28`} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={`block ${labelClass}`}>
          Department
          <select name="department" value={department} onChange={(event) => setDepartment(event.target.value)} className={inputClass}>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="accessories">Accessories</option>
          </select>
        </label>
        <label className={`block ${labelClass}`}>
          Subcategory
          <select name="categoryId" value={selectedCategory} onChange={(event) => setCategoryId(event.target.value)} className={inputClass} required>
            {options.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className={`block ${labelClass}`}>Material<input name="material" defaultValue={product?.material} className={inputClass} /></label>
        <label className={`block ${labelClass}`}>Fit<input name="fit" defaultValue={product?.fit} className={inputClass} /></label>
        <label className={`block ${labelClass}`}>Care<input name="care" defaultValue={product?.care} className={inputClass} /></label>
      </div>
      <label className={`block ${labelClass}`}>
        Tags, comma separated
        <input name="tags" defaultValue={product?.tags} className={inputClass} />
      </label>
      <fieldset className="space-y-3">
        <legend className={labelClass}>Flags</legend>
        <label className="mr-4 text-sm"><input type="checkbox" name="isNewArrival" defaultChecked={product?.isNewArrival} className="mr-2" />New arrival</label>
        <label className="mr-4 text-sm"><input type="checkbox" name="isBestseller" defaultChecked={product?.isBestseller} className="mr-2" />Bestseller</label>
        <label className="text-sm"><input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? false} className="mr-2" />Active on the shop</label>
      </fieldset>
      <fieldset>
        <legend className={labelClass}>Variants</legend>
        <p className="mt-2 text-sm text-charcoal">Prices are rupees. They are stored as paise. Example: 999 becomes 99900 paise.</p>
        <ul className="mt-4 space-y-4">
          {variants.map((variant, index) => (
            <li key={index} className="grid gap-2 border border-line p-3 sm:grid-cols-4">
              <input aria-label="Size" value={variant.size} onChange={(event) => updateVariant(index, { size: event.target.value })} placeholder="Size" className="border border-line px-2 py-2" />
              <input aria-label="Colour" value={variant.color} onChange={(event) => updateVariant(index, { color: event.target.value })} placeholder="Colour" className="border border-line px-2 py-2" />
              <input aria-label="Hex colour" value={variant.hex} onChange={(event) => updateVariant(index, { hex: event.target.value })} placeholder="#171717" className="border border-line px-2 py-2" />
              <input aria-label="SKU" value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value.toUpperCase() })} placeholder="SKU" className="border border-line px-2 py-2" />
              <input aria-label="Price in rupees" value={variant.price} onChange={(event) => updateVariant(index, { price: event.target.value })} placeholder="Price ₹" className="border border-line px-2 py-2" />
              <input aria-label="Comparison price in rupees" value={variant.compare} onChange={(event) => updateVariant(index, { compare: event.target.value })} placeholder="Was ₹" className="border border-line px-2 py-2" />
              <input aria-label="Stock" value={variant.stock} onChange={(event) => updateVariant(index, { stock: event.target.value })} placeholder="Stock" inputMode="numeric" className="border border-line px-2 py-2" />
              <button type="button" className="text-left text-[11px] tracking-[0.14em] uppercase" onClick={() => setVariants((current) => current.filter((_, rowIndex) => rowIndex !== index))}>Remove</button>
            </li>
          ))}
        </ul>
        <button type="button" className="mt-3 text-[11px] tracking-[0.14em] uppercase" onClick={() => setVariants((current) => [...current, emptyVariant()])}>Add variant</button>
      </fieldset>
      <button type="submit" disabled={pending} className="h-12 bg-ink px-8 text-[11px] tracking-[0.16em] text-ivory uppercase disabled:bg-stone">
        {pending ? "Saving" : "Save product"}
      </button>
    </form>
  );
}

function AdminNotice({ state }: { state: ActionState }) {
  if (!state.error && !state.message) return null;
  return <p role={state.error ? "alert" : "status"} className="text-sm">{state.error ?? state.message}</p>;
}
