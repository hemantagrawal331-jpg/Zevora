import { categories, type CategoryId } from "@/lib/categories";
import { images } from "@/lib/images";

export type NavLink = {
  label: string;
  href: string;
};

export type NavColumn = {
  title: string;
  links: NavLink[];
};

export type NavFeature = {
  href: string;
  image: string;
  alt: string;
  caption: string;
};

export type NavItem = {
  label: string;
  href: string;
  columns: NavColumn[];
  feature: NavFeature;
};

const features: Record<CategoryId | "shop" | "new" | "sale", NavFeature> = {
  shop: {
    href: "/shop",
    image: images.hero,
    alt: "Woman standing in a studio wearing a black blazer.",
    caption: "The collection",
  },
  new: {
    href: "/new-arrivals",
    image: images.products.camelCoat,
    alt: "Camel wool coat from the new arrivals.",
    caption: "Just in",
  },
  men: {
    href: "/men/jackets",
    image: images.categoryMen,
    alt: "Man in a navy suit.",
    caption: "Jackets",
  },
  women: {
    href: "/women/jackets",
    image: images.categoryWomen,
    alt: "Woman in a powder-blue coat in a city square.",
    caption: "Jackets",
  },
  accessories: {
    href: "/accessories/bags",
    image: images.categoryAccessories,
    alt: "Layered gold necklaces.",
    caption: "Bags and jewellery",
  },
  sale: {
    href: "/sale",
    image: images.products.floralDress,
    alt: "Floral wrap dress from the sale edit.",
    caption: "Now reduced",
  },
};

function subcategoryColumns(categoryId: CategoryId): NavColumn[] {
  const category = categories.find((item) => item.id === categoryId);
  if (!category) return [];
  const links = category.subcategories.map((subcategory) => ({
    label: subcategory.label,
    href: `${category.href}/${subcategory.slug}`,
  }));
  const midpoint = Math.ceil(links.length / 2);
  return [
    { title: "Clothing", links: links.slice(0, midpoint) },
    { title: "More", links: links.slice(midpoint) },
  ].filter((column) => column.links.length > 0);
}

export const navigation: NavItem[] = [
  {
    label: "Shop",
    href: "/shop",
    columns: [
      {
        title: "Departments",
        links: [
          { label: "All clothing", href: "/shop" },
          ...categories.map((category) => ({ label: category.label, href: category.href })),
          { label: "New arrivals", href: "/new-arrivals" },
          { label: "Sale", href: "/sale" },
        ],
      },
    ],
    feature: features.shop,
  },
  {
    label: "New Arrivals",
    href: "/new-arrivals",
    columns: [
      {
        title: "Just in",
        links: [
          { label: "All new arrivals", href: "/new-arrivals" },
          ...categories.map((category) => ({ label: category.label, href: category.href })),
        ],
      },
    ],
    feature: features.new,
  },
  ...categories.map((category) => ({
    label: category.label,
    href: category.href,
    columns: [
      {
        title: "Featured",
        links: [
          { label: `All ${category.label.toLowerCase()}`, href: category.href },
          { label: "New arrivals", href: "/new-arrivals" },
          { label: "Sale", href: `/sale?department=${category.id}` },
        ],
      },
      ...subcategoryColumns(category.id),
    ],
    feature: features[category.id],
  })),
  {
    label: "Sale",
    href: "/sale",
    columns: [
      {
        title: "Sale",
        links: [
          { label: "All sale", href: "/sale" },
          ...categories.map((category) => ({
            label: category.label,
            href: `/sale?department=${category.id}`,
          })),
        ],
      },
    ],
    feature: features.sale,
  },
];

export function isNavCurrent(href: string, pathname: string) {
  const path = href.split("?")[0] ?? href;
  if (path === "/shop" || path === "/new-arrivals" || path === "/sale") return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}

export const footerNavigation = {
  support: [
    { label: "Customer support", href: "/support" },
    { label: "Contact", href: "/contact" },
    { label: "Shipping", href: "/shipping" },
    { label: "Returns", href: "/returns" },
  ],
  company: [
    { label: "The house", href: "/about" },
    { label: "Shop", href: "/shop" },
    { label: "New arrivals", href: "/new-arrivals" },
    { label: "Account", href: "/account" },
  ],
  legal: [
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};
