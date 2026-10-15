import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/container";
import { ProductDetail } from "@/components/product-detail";
import { ProductGrid } from "@/components/product-grid";
import { CatalogSkeleton } from "@/components/skeletons";
import { loadStorefront } from "@/lib/commerce/catalogue";
import { getCategory, subcategoryLabel } from "@/lib/categories";
import { activeProducts } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function generateStaticParams() {
  if (isSupabaseConfigured()) return [];
  return activeProducts().map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadStorefront();
  const product = loaded.products.find((item) => item.slug === slug);
  if (!product) return { title: "Piece" };
  return { title: product.name, description: product.description };
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await loadStorefront();
  const product = loaded.products.find((item) => item.slug === slug);
  if (!product) notFound();
  const related = loaded.products
    .filter((item) => item.id !== product.id && item.category === product.category)
    .slice(0, 4);
  const category = getCategory(product.category);

  return (
    <Container className="py-8 md:py-12">
      {loaded.error ? <p className="mb-6 text-sm">{loaded.error}</p> : null}
      <nav aria-label="Breadcrumb" className="text-[11px] tracking-[0.14em] text-stone uppercase">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/shop" className="hover:text-ink">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/${product.category}`} className="hover:text-ink">
              {category?.label ?? product.category}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/${product.category}/${product.subcategory}`} className="hover:text-ink">
              {subcategoryLabel(product.category, product.subcategory)}
            </Link>
          </li>
        </ol>
      </nav>
      <div className="mt-6">
        <ProductDetail product={product} />
      </div>
      {related.length > 0 ? (
        <section className="mt-20 border-t border-line pt-12" aria-labelledby="related-title">
          <h2 id="related-title" className="mb-8 font-display text-4xl">
            You may also like
          </h2>
          <ProductGrid products={related} />
        </section>
      ) : null}
    </Container>
  );
}
