import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { FashionImage } from "@/components/fashion-image";
import { ProductGrid } from "@/components/product-grid";
import { PurchasePanel } from "@/components/purchase-panel";
import { getProduct, getRelated } from "@/lib/catalog";
import { departmentLabels, products, subcategoryLabels } from "@/lib/products";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Piece" };
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const related = getRelated(product);
  const categoryLabel = subcategoryLabels[product.subcategory] ?? product.descriptor;

  return (
    <Container className="py-8 md:py-12">
      <nav aria-label="Breadcrumb" className="text-[11px] tracking-[0.14em] text-stone uppercase">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href={`/${product.department}`} className="hover:text-ink">
              {departmentLabels[product.department]}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/${product.department}/${product.subcategory}`}
              className="hover:text-ink"
            >
              {categoryLabel}
            </Link>
          </li>
        </ol>
      </nav>
      <div className="mt-6 grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[3/4] bg-sand">
          <FashionImage
            src={product.image}
            alt={product.imageAlt}
            fit={product.imageFit}
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        <div className="lg:sticky lg:top-32 lg:py-4">
          <p className="text-[11px] tracking-[0.18em] text-stone uppercase">{product.descriptor}</p>
          <h1 className="mt-3 font-display text-5xl leading-none md:text-6xl">{product.name}</h1>
          <div className="mt-8">
            <PurchasePanel key={product.id} product={product} />
          </div>
        </div>
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
