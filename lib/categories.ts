export type CategoryId = "men" | "women" | "accessories";

export type Subcategory = {
  slug: string;
  label: string;
  keywords: readonly string[];
};

export type Category = {
  id: CategoryId;
  label: string;
  href: string;
  description: string;
  subcategories: readonly Subcategory[];
};

export const categories = [
  {
    id: "men",
    label: "Men",
    href: "/men",
    description: "Denim, sweats, shirts, and jackets for men.",
    subcategories: [
      { slug: "denim-jeans", label: "Denim jeans", keywords: ["denim", "jeans"] },
      { slug: "hoodies", label: "Hoodies", keywords: ["hoodie", "sweat"] },
      { slug: "sweatshirts", label: "Sweatshirts", keywords: ["sweatshirt", "sweat"] },
      { slug: "joggers", label: "Joggers and lowers", keywords: ["jogger", "lower", "track"] },
      { slug: "gymwear", label: "Gymwear and activewear", keywords: ["gym", "active", "training"] },
      { slug: "t-shirts", label: "T-shirts", keywords: ["t-shirt", "tee"] },
      { slug: "shirts", label: "Shirts", keywords: ["shirt", "oxford"] },
      { slug: "jackets", label: "Jackets", keywords: ["jacket", "coat", "blazer"] },
      { slug: "cargo-pants", label: "Cargo pants", keywords: ["cargo", "pants"] },
      { slug: "shorts", label: "Shorts", keywords: ["shorts"] },
    ],
  },
  {
    id: "women",
    label: "Women",
    href: "/women",
    description: "Tops, denim, dresses, and sets for women.",
    subcategories: [
      { slug: "crop-tops", label: "Crop tops", keywords: ["crop", "top"] },
      { slug: "tops", label: "Tops and T-shirts", keywords: ["top", "t-shirt", "tee", "blouse"] },
      { slug: "hoodies", label: "Hoodies", keywords: ["hoodie"] },
      { slug: "jeans", label: "Jeans", keywords: ["jeans", "denim"] },
      { slug: "denim", label: "Denim", keywords: ["denim"] },
      { slug: "skirts", label: "Skirts", keywords: ["skirt"] },
      { slug: "shorts", label: "Shorts", keywords: ["shorts"] },
      { slug: "dresses", label: "Dresses", keywords: ["dress"] },
      { slug: "jackets", label: "Jackets", keywords: ["jacket", "coat"] },
      { slug: "co-ord-sets", label: "Co-ord sets", keywords: ["co-ord", "coord", "set"] },
    ],
  },
  {
    id: "accessories",
    label: "Accessories",
    href: "/accessories",
    description: "Wallets, belts, scent, caps, eyewear, bags, and jewellery.",
    subcategories: [
      { slug: "wallets", label: "Wallets", keywords: ["wallet"] },
      { slug: "belts", label: "Belts", keywords: ["belt"] },
      { slug: "perfumes", label: "Perfumes", keywords: ["perfume", "scent"] },
      { slug: "caps", label: "Caps", keywords: ["cap", "hat"] },
      { slug: "sunglasses", label: "Sunglasses", keywords: ["sunglasses", "eyewear"] },
      { slug: "bags", label: "Bags", keywords: ["bag", "tote"] },
      { slug: "fashion-jewellery", label: "Fashion jewellery", keywords: ["jewellery", "jewelry", "necklace"] },
      { slug: "essentials", label: "Other fashion essentials", keywords: ["essential", "wrap", "scarf"] },
    ],
  },
] as const satisfies readonly Category[];

export function isCategoryId(value: string): value is CategoryId {
  return categories.some((category) => category.id === value);
}

export function getCategory(id: string) {
  return categories.find((category) => category.id === id);
}

export function getSubcategory(categoryId: string, slug: string) {
  return getCategory(categoryId)?.subcategories.find((subcategory) => subcategory.slug === slug);
}

export function subcategoryLabel(categoryId: string, slug: string) {
  return getSubcategory(categoryId, slug)?.label ?? slug;
}
