"use client";

import { use } from "react";
import { CatalogView } from "@/components/catalog-view";
import { getSaleProducts, isDepartment } from "@/lib/catalog";
import { departmentLabels } from "@/lib/products";

export function SaleCatalog({
  searchParams,
}: {
  searchParams: Promise<{ department?: string | string[] }>;
}) {
  const params = use(searchParams);
  const raw = params.department;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const department = value && isDepartment(value) ? value : undefined;
  const products = getSaleProducts(department);

  return (
    <CatalogView
      eyebrow="Reduced"
      title={department ? `${departmentLabels[department]} sale` : "Sale"}
      description="A short list of pieces from the previous delivery, marked down in rupees."
      products={products}
    />
  );
}
