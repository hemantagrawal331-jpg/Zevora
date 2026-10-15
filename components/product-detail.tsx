"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FashionImage } from "@/components/fashion-image";
import { HeartIcon } from "@/components/icons";
import { Price } from "@/components/price";
import { addToBag, useWishlist } from "@/components/store";
import { toggleWishlistAction } from "@/lib/commerce/actions";
import { checkDeliveryPin, type DeliveryQuote } from "@/lib/delivery";
import { findVariant, imagesFor, photographedColor, sizeStock, type Product } from "@/lib/products";

export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const wishlist = useWishlist();
  const wished = wishlist.has(product.id);
  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0].label : null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pin, setPin] = useState("");
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [checking, setChecking] = useState(false);
  const gallery = imagesFor(product, color);
  const [activeImage, setActiveImage] = useState(0);
  const shown = gallery[Math.min(activeImage, gallery.length - 1)] ?? gallery[0];
  const stock = sizeStock(product, size, color);
  const anyStock = product.sizes.some((item) => item.stockQuantity > 0);
  const variant = findVariant(product, size, color);
  const displayPrice = variant?.priceInPaise ?? product.priceInPaise;
  const displayCompare = variant ? variant.compareAtPriceInPaise : product.compareAtPriceInPaise;
  const photoColor = photographedColor(product);
  const quantityOptions = stock > 0 ? Array.from({ length: Math.min(5, stock) }, (_, index) => index + 1) : [1];

  function chooseColor(next: string) {
    setColor(next);
    setActiveImage(0);
  }

  function validate() {
    if (!anyStock) return "This piece is out of stock.";
    if (!size) return "Select a size.";
    if (stock <= 0) return "This size is out of stock.";
    return "";
  }

  function onAdd() {
    const problem = validate();
    if (problem || !size) {
      setError(problem || "Select a size.");
      setNotice("");
      return false;
    }
    const result = addToBag({ product, color, size, quantity });
    if (!result.ok) {
      setError(result.message);
      setNotice("");
      return false;
    }
    setError("");
    setNotice("Added to bag");
    return true;
  }

  return (
    <div>
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <div className="relative aspect-[3/4] bg-sand">
            {shown ? (
              <FashionImage src={shown.src} alt={shown.alt} fit={shown.fit} priority sizes="(max-width: 1024px) 100vw, 50vw" />
            ) : null}
          </div>
          {gallery.length > 1 ? (
            <ul className="mt-3 flex gap-3" aria-label="More photographs">
              {gallery.map((image, index) => (
                <li key={`${image.src}-${image.role}-${index}`}>
                  <button
                    type="button"
                    aria-pressed={index === activeImage}
                    aria-label={`Photograph ${index + 1}`}
                    onClick={() => setActiveImage(index)}
                    className={`relative h-20 w-16 bg-sand ${index === activeImage ? "ring-1 ring-ink" : ""}`}
                  >
                    <FashionImage src={image.src} alt={image.alt} fit={image.fit} sizes="64px" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="lg:sticky lg:top-32 lg:py-4">
          <p className="text-[11px] tracking-[0.18em] text-stone uppercase">{product.sku}</p>
          <h1 className="mt-3 font-display text-5xl leading-none md:text-6xl">{product.name}</h1>
          <Price priceInPaise={displayPrice} compareAtPriceInPaise={displayCompare} className="mt-6 text-base" />
          <p className="mt-3 text-sm text-charcoal">
            {product.demo
              ? "Sample piece. It is not catalogue stock and cannot be ordered."
              : !anyStock
              ? "Out of stock"
              : stock > 0
                ? stock <= 3
                  ? `Only ${stock} left in this size`
                  : "In stock"
                : size
                  ? "Out of stock"
                  : "Select a size to see availability"}
          </p>
          {product.colors.length > 1 ? (
            <fieldset className="mt-8">
              <legend className="text-[11px] tracking-[0.16em] uppercase">Colour · {color}</legend>
              {photoColor && photoColor !== color ? <p className="mt-2 text-xs text-stone">Photograph shows {photoColor}.</p> : null}
              <ul className="mt-4 flex gap-3">
                {product.colors.map((swatch) => {
                  const selected = swatch.name === color;
                  return (
                    <li key={swatch.name}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        aria-label={swatch.name}
                        onClick={() => chooseColor(swatch.name)}
                        className={`flex h-11 w-11 items-center justify-center rounded-full border ${selected ? "border-ink" : "border-transparent"}`}
                      >
                        <span className={`h-5 w-5 rounded-full border ${selected ? "border-ink ring-1 ring-ink" : "border-line"}`} style={{ backgroundColor: swatch.hex }} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ) : (
            <p className="mt-8 text-sm">Colour · {color}</p>
          )}
          <fieldset className="mt-8">
            <legend className="text-[11px] tracking-[0.16em] uppercase">Size</legend>
      {product.sizes.some((item) => item.label !== "One size" && item.label !== "50 ml") ? (
        <div className="mt-2">
          <SizeGuide />
        </div>
      ) : null}
            <ul className="mt-4 flex flex-wrap gap-2">
              {product.sizes.map((option) => {
                const selected = option.label === size;
                const unavailable = option.stockQuantity <= 0;
                return (
                  <li key={option.label}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      disabled={unavailable}
                      onClick={() => {
                        setSize(option.label);
                        setQuantity(1);
                        setError("");
                      }}
                      className={`h-11 min-w-14 border px-3 text-sm ${selected ? "border-ink bg-ink text-ivory" : "border-line hover:border-ink"} disabled:text-stone disabled:line-through`}
                    >
                      {option.label}
                    </button>
                  </li>
                );
              })}
            </ul>
            {error ? <p className="mt-3 text-sm" role="alert">{error}</p> : null}
          </fieldset>
          <div className="mt-8 flex items-center gap-4">
            <label className="text-[11px] tracking-[0.16em] uppercase">
              Qty
              <select
                value={quantity}
                disabled={stock <= 0}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="ml-3 bg-transparent py-2 text-sm"
                aria-label="Quantity"
              >
                {quantityOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={onAdd} disabled={!anyStock || (Boolean(size) && stock <= 0)} className="h-12 flex-1 bg-ink text-[11px] tracking-[0.18em] text-ivory uppercase hover:bg-charcoal disabled:bg-stone">
              Add to bag
            </button>
            <button
              type="button"
              onClick={() => {
                if (onAdd()) router.push("/bag");
              }}
              disabled={!anyStock || (Boolean(size) && stock <= 0)}
              className="h-12 flex-1 border border-ink text-[11px] tracking-[0.18em] uppercase disabled:border-line disabled:text-stone"
            >
              Buy now
            </button>
            <button
              type="button"
              aria-pressed={wished}
              aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
              onClick={() => {
                wishlist.toggleWishlist(product.id);
                if (!product.demo) void toggleWishlistAction(product.id);
              }}
              className="flex h-12 w-12 items-center justify-center border border-ink"
            >
              <HeartIcon filled={wished} className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-sm" role="status">{notice}</p>
          <form
            className="mt-8 border-t border-line pt-6"
            onSubmit={async (event) => {
              event.preventDefault();
              setChecking(true);
              const result = await checkDeliveryPin(pin);
              setQuote(result);
              setChecking(false);
            }}
          >
            <label htmlFor="delivery-pin" className="text-[11px] tracking-[0.16em] uppercase">
              Delivery PIN code
            </label>
            <div className="mt-3 flex gap-3">
              <input
                id="delivery-pin"
                inputMode="numeric"
                autoComplete="postal-code"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                className="h-11 w-36 border border-line bg-transparent px-3 outline-none"
              />
              <button type="submit" disabled={checking} className="h-11 px-4 text-[11px] tracking-[0.16em] uppercase">
                {checking ? "Checking" : "Check"}
              </button>
            </div>
            {quote ? <p className="mt-3 text-sm leading-6 text-charcoal" role="status">{quote.message}</p> : null}
          </form>
          <p className="mt-6 text-sm leading-6 text-charcoal">
            <Link href="/shipping" className="underline">Shipping</Link>
            {" · "}
            <Link href="/returns" className="underline">Returns and exchanges</Link>
          </p>
        </div>
      </div>
      <section className="mt-16 grid gap-10 border-t border-line pt-10 md:grid-cols-2">
        <div>
          <h2 className="text-[11px] tracking-[0.16em] uppercase">Description</h2>
          <p className="mt-4 text-sm leading-7 text-charcoal">{product.description}</p>
          <p className="mt-4 text-sm text-stone">Demo listing. Replace the photographs in the product record without changing this page.</p>
        </div>
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-[11px] tracking-[0.16em] uppercase">Material</dt>
            <dd className="mt-1 text-charcoal">{product.material}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-[0.16em] uppercase">Fit</dt>
            <dd className="mt-1 text-charcoal">{product.fit}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-[0.16em] uppercase">Care</dt>
            <dd className="mt-1 text-charcoal">{product.care}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function SizeGuide() {
  const rows = [
    ["XS", "86", "71"],
    ["S", "91", "76"],
    ["M", "97", "81"],
    ["L", "104", "89"],
    ["XL", "112", "97"],
  ];
  return (
    <details className="text-[11px] tracking-[0.14em] normal-case">
      <summary className="cursor-pointer uppercase">Size guide</summary>
      <div className="mt-3 border border-line p-4">
        <p className="text-stone">Demo measurements in centimetres. Replace with the ZEVORA size chart.</p>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-1 font-normal">Size</th>
              <th className="py-1 font-normal">Chest</th>
              <th className="py-1 font-normal">Waist</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="border-t border-line">
                {row.map((cell) => (
                  <td key={cell} className="py-1">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
