import {
  products,
  subcategoryLabels,
  type Department,
  type Product,
} from "@/lib/products";

export type SortKey = "featured" | "price-asc" | "price-desc" | "new";

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}

export function getByDepartment(department: Department) {
  return products.filter((product) => product.department === department);
}

export function getBySubcategory(department: Department, subcategory: string) {
  return products.filter(
    (product) =>
      product.department === department && product.subcategory === subcategory,
  );
}

export function getNewArrivals() {
  return products.filter((product) => product.isNew);
}

export function getBestsellers() {
  return products.filter((product) => product.isBestseller);
}

export function getSaleProducts(department?: Department) {
  return products.filter((product) => {
    const onSale = Boolean(
      product.compareAtPrice && product.compareAtPrice > product.price,
    );
    if (!onSale) return false;
    if (!department) return true;
    return product.department === department;
  });
}

export function searchProducts(query: string) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  return products.filter((product) => {
    const haystack = [
      product.name,
      product.descriptor,
      product.department,
      product.subcategory,
      subcategoryLabels[product.subcategory] ?? "",
      product.description,
      ...product.colors.map((color) => color.name),
    ]
      .join(" ")
      .toLowerCase();

    return terms.every((term) => haystack.includes(term));
  });
}

export function getRelated(product: Product) {
  const sameCategory = products.filter(
    (item) =>
      item.id !== product.id &&
      item.department === product.department &&
      item.subcategory === product.subcategory,
  );
  const sameDepartment = products.filter(
    (item) =>
      item.id !== product.id &&
      item.department === product.department &&
      item.subcategory !== product.subcategory,
  );
  return [...sameCategory, ...sameDepartment].slice(0, 4);
}

export function sortProducts(items: Product[], sort: SortKey) {
  const next = [...items];
  if (sort === "price-asc") next.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") next.sort((a, b) => b.price - a.price);
  if (sort === "new") {
    next.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
  }
  return next;
}

export function subcategoryParams(department: Department) {
  const slugs = [
    ...new Set(
      products
        .filter((product) => product.department === department)
        .map((product) => product.subcategory),
    ),
  ];
  return slugs.map((subcategory) => ({ subcategory }));
}

export function isDepartment(value: string): value is Department {
  return value === "men" || value === "women" || value === "accessories";
}
