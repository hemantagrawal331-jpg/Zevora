import Link from "next/link";
import { Container } from "@/components/container";
import { FashionImage } from "@/components/fashion-image";
import { ProductGrid } from "@/components/product-grid";
import { images } from "@/lib/images";
import type { Product } from "@/lib/products";

const categories = [
  {
    href: "/men",
    label: "Men",
    image: images.categoryMen,
    alt: "Man in a navy suit walking past a glass facade.",
  },
  {
    href: "/women",
    label: "Women",
    image: images.categoryWomen,
    alt: "Woman in a powder-blue coat and scarf in a city square.",
  },
  {
    href: "/accessories",
    label: "Accessories",
    image: images.categoryAccessories,
    alt: "Layered gold necklaces worn with a white shirt.",
  },
];

export function Hero() {
  return (
    <section aria-label="New season">
      <div className="relative min-h-[70vh] bg-sand lg:min-h-[82vh]">
        <div className="relative h-[70vh] lg:h-[82vh]">
          <FashionImage
            src={images.hero}
            alt="Woman standing in a studio wearing a black blazer, white shirt, and black trousers."
            priority
            sizes="100vw"
            className="object-[68%_center]"
          />
        </div>
        <div className="bg-ivory px-4 py-8 sm:px-6 md:absolute md:bottom-12 md:left-10 md:max-w-md md:bg-transparent md:px-0 md:py-0 lg:bottom-16 lg:left-14">
          <p className="text-[11px] tracking-[0.22em] uppercase">Autumn / Winter</p>
          <h1 className="mt-3 font-display text-5xl leading-[0.95] md:text-7xl">The new season</h1>
          <Link
            href="/new-arrivals"
            className="mt-8 inline-flex h-11 items-center bg-ink px-6 text-[11px] tracking-[0.18em] text-ivory uppercase hover:bg-charcoal"
          >
            Shop new arrivals
          </Link>
        </div>
      </div>
    </section>
  );
}

export function CategoryTiles() {
  return (
    <section aria-label="Shop by category">
      <ul className="grid md:grid-cols-3">
        {categories.map((category) => (
          <li key={category.href}>
            <Link href={category.href} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden bg-sand">
                <FashionImage
                  src={category.image}
                  alt={category.alt}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transform-none"
                />
              </div>
              <span className="block py-4 text-center text-[12px] tracking-[0.22em] uppercase">
                {category.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProductSection({
  title,
  href,
  products,
}: {
  title: string;
  href: string;
  products: Product[];
}) {
  return (
    <section className="py-14 md:py-20">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-6">
          <h2 className="font-display text-4xl leading-none md:text-5xl">{title}</h2>
          <Link
            href={href}
            className="shrink-0 border-b border-ink pb-0.5 text-[11px] tracking-[0.16em] uppercase"
          >
            View all
          </Link>
        </div>
        <ProductGrid products={products} />
      </Container>
    </section>
  );
}

export function BrandStory() {
  return (
    <section className="border-t border-line">
      <div className="grid lg:grid-cols-2">
        <div className="flex items-center px-4 py-16 sm:px-8 lg:px-16 lg:py-24">
          <div className="max-w-md">
            <p className="text-[11px] tracking-[0.2em] text-stone uppercase">The house</p>
            <h2 className="mt-4 font-display text-4xl leading-[0.95] tracking-wide md:text-6xl">
              STYLE THAT SPEAKS FOR ITSELF
            </h2>
            <p className="mt-6 text-sm leading-7 text-charcoal">
              ZEVORA makes clothing and accessories for days that do not need an explanation.
              Tailoring, knits, and small leather goods, considered in India and cut in fabrics
              that hold their shape.
            </p>
            <Link
              href="/about"
              className="mt-8 inline-block border-b border-ink pb-0.5 text-[11px] tracking-[0.16em] uppercase"
            >
              Read the approach
            </Link>
          </div>
        </div>
        <div className="relative min-h-[420px] bg-sand lg:min-h-[640px]">
          <FashionImage
            src={images.story}
            alt="Knitwear hanging on a rail, seen through a shop window."
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}

export function EditorialLook() {
  return (
    <section className="relative min-h-[70vh] bg-sand" aria-label="Shop the look">
      <div className="relative h-[70vh]">
        <FashionImage
          src={images.products.beltedCoat}
          alt="Woman on stone steps wearing a belted camel wrap coat."
          sizes="100vw"
          className="object-[center_20%]"
        />
      </div>
      <div className="bg-ivory px-4 py-8 sm:px-6 md:absolute md:bottom-12 md:left-10 md:bg-transparent md:px-0 md:py-0 lg:left-14">
        <p className="text-[11px] tracking-[0.2em] uppercase">The coat</p>
        <p className="mt-3 max-w-xs font-display text-4xl leading-none md:text-5xl">
          Belted, and left at that
        </p>
        <Link
          href="/product/belted-camel-coat"
          className="mt-6 inline-flex h-11 items-center bg-ink px-6 text-[11px] tracking-[0.18em] text-ivory uppercase hover:bg-charcoal"
        >
          Shop the look
        </Link>
      </div>
    </section>
  );
}
