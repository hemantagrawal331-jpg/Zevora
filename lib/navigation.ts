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

export const navigation: NavItem[] = [
  {
    label: "New Arrivals",
    href: "/new-arrivals",
    columns: [
      {
        title: "Just in",
        links: [
          { label: "All new arrivals", href: "/new-arrivals" },
          { label: "Menswear", href: "/men" },
          { label: "Womenswear", href: "/women" },
          { label: "Accessories", href: "/accessories" },
        ],
      },
      {
        title: "Highlighted",
        links: [
          { label: "Coats", href: "/women/outerwear" },
          { label: "Knitwear", href: "/men/knitwear" },
          { label: "Sunglasses", href: "/accessories/sunglasses" },
        ],
      },
    ],
    feature: {
      href: "/new-arrivals",
      image: images.products.camelCoat,
      alt: "Camel wool coat from the new arrivals.",
      caption: "The new coat",
    },
  },
  {
    label: "Men",
    href: "/men",
    columns: [
      {
        title: "Featured",
        links: [
          { label: "All menswear", href: "/men" },
          { label: "New arrivals", href: "/new-arrivals" },
          { label: "Sale", href: "/sale?department=men" },
        ],
      },
      {
        title: "Clothing",
        links: [
          { label: "Outerwear", href: "/men/outerwear" },
          { label: "Knitwear", href: "/men/knitwear" },
        ],
      },
    ],
    feature: {
      href: "/men/outerwear",
      image: images.categoryMen,
      alt: "Man in a navy suit.",
      caption: "Tailoring",
    },
  },
  {
    label: "Women",
    href: "/women",
    columns: [
      {
        title: "Featured",
        links: [
          { label: "All womenswear", href: "/women" },
          { label: "New arrivals", href: "/new-arrivals" },
          { label: "Sale", href: "/sale?department=women" },
        ],
      },
      {
        title: "Clothing",
        links: [
          { label: "Dresses", href: "/women/dresses" },
          { label: "Tops", href: "/women/tops" },
          { label: "Knitwear", href: "/women/knitwear" },
          { label: "Outerwear", href: "/women/outerwear" },
        ],
      },
    ],
    feature: {
      href: "/women/outerwear",
      image: images.categoryWomen,
      alt: "Woman in a powder-blue coat in a city square.",
      caption: "Outerwear",
    },
  },
  {
    label: "Accessories",
    href: "/accessories",
    columns: [
      {
        title: "Shop",
        links: [
          { label: "All accessories", href: "/accessories" },
          { label: "Bags", href: "/accessories/bags" },
          { label: "Jewelry", href: "/accessories/jewelry" },
          { label: "Sunglasses", href: "/accessories/sunglasses" },
          { label: "Scarves", href: "/accessories/scarves" },
        ],
      },
    ],
    feature: {
      href: "/accessories/jewelry",
      image: images.categoryAccessories,
      alt: "Layered gold necklaces.",
      caption: "Jewelry",
    },
  },
  {
    label: "Sale",
    href: "/sale",
    columns: [
      {
        title: "Sale",
        links: [
          { label: "All sale", href: "/sale" },
          { label: "Men", href: "/sale?department=men" },
          { label: "Women", href: "/sale?department=women" },
          { label: "Accessories", href: "/sale?department=accessories" },
        ],
      },
    ],
    feature: {
      href: "/sale",
      image: images.products.floralDress,
      alt: "Floral wrap dress from the sale edit.",
      caption: "Now reduced",
    },
  },
];

export const footerNavigation = {
  support: [
    { label: "Customer support", href: "/support" },
    { label: "Contact", href: "/contact" },
    { label: "Shipping", href: "/shipping" },
    { label: "Returns", href: "/returns" },
  ],
  company: [
    { label: "The house", href: "/about" },
    { label: "New arrivals", href: "/new-arrivals" },
    { label: "Account", href: "/account" },
  ],
  legal: [
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};
