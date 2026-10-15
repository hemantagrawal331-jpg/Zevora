import type { SourcingDepartment } from "@/lib/sourcing/types";

export const sourcingCategories: Record<SourcingDepartment, readonly string[]> = {
  MEN: [
    "Denim",
    "Jeans",
    "Hoodies",
    "Lowers",
    "Sweatshirts",
    "Gymwear",
    "T-shirts",
    "Shirts",
    "Cargos",
    "Shorts",
    "Jackets",
  ],
  WOMEN: [
    "Crop tops",
    "Jeans",
    "Denim",
    "Skirts",
    "Shorts",
    "Hoodies",
    "Tops",
    "Dresses",
    "Jackets",
    "Co-ord sets",
  ],
  ACCESSORIES: ["Wallets", "Belts", "Perfumes", "Caps", "Sunglasses", "Bags", "Fashion accessories"],
};

export const sourcingDepartments = Object.keys(sourcingCategories) as SourcingDepartment[];

export function subcategoriesFor(department: string) {
  if (department === "MEN" || department === "WOMEN" || department === "ACCESSORIES") {
    return sourcingCategories[department];
  }
  return [];
}
