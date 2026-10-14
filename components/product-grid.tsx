import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/products";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="border border-line px-6 py-16 text-center">
        <p className="font-display text-3xl">Nothing in this edit</p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-charcoal">
          There are no pieces here yet. Browse another category, or come back when the next delivery lands.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
