"use client";

import { useSyncExternalStore } from "react";
import { decideBagQuantity } from "@/lib/bag-rules";
import { getProductById } from "@/lib/catalog";
import { findVariant, mainImage, sizeStock, type Product } from "@/lib/products";

export type BagLine = {
  productId: string;
  variantId: string | null;
  color: string;
  size: string | null;
  quantity: number;
  name?: string;
  priceInPaise?: number;
  imageSrc?: string;
  imageAlt?: string;
  sku?: string;
  stockHint?: number;
};

const BAG_KEY = "zevora-bag";
const WISH_KEY = "zevora-wishlist";
const MAX_QTY = 5;
const EMPTY_LINES: BagLine[] = [];
const EMPTY_WISH: string[] = [];

let bagSnapshot: BagLine[] = EMPTY_LINES;
let bagRaw: string | null = null;
const bagListeners = new Set<() => void>();

let wishSnapshot: string[] = EMPTY_WISH;
let wishRaw: string | null = null;
const wishListeners = new Set<() => void>();

function isLine(value: unknown): value is BagLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.productId === "string" &&
    typeof line.color === "string" &&
    (line.size === null || typeof line.size === "string") &&
    (line.variantId === undefined || line.variantId === null || typeof line.variantId === "string") &&
    typeof line.quantity === "number" &&
    line.quantity > 0
  );
}

function parseBag(raw: string): BagLine[] {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return EMPTY_LINES;
    const lines = data.filter(isLine).map((line) => ({
      ...line,
      variantId: line.variantId ?? null,
      quantity: Math.min(MAX_QTY, Math.floor(line.quantity)),
    }));
    return lines.length > 0 ? lines : EMPTY_LINES;
  } catch {
    return EMPTY_LINES;
  }
}

function parseWish(raw: string): string[] {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return EMPTY_WISH;
    const ids = data.filter((item): item is string => typeof item === "string");
    return ids.length > 0 ? ids : EMPTY_WISH;
  } catch {
    return EMPTY_WISH;
  }
}

function readBag() {
  if (typeof window === "undefined") return EMPTY_LINES;
  const nextRaw = window.localStorage.getItem(BAG_KEY) ?? "[]";
  if (nextRaw === bagRaw) return bagSnapshot;
  bagRaw = nextRaw;
  bagSnapshot = parseBag(nextRaw);
  return bagSnapshot;
}

function readWish() {
  if (typeof window === "undefined") return EMPTY_WISH;
  const nextRaw = window.localStorage.getItem(WISH_KEY) ?? "[]";
  if (nextRaw === wishRaw) return wishSnapshot;
  wishRaw = nextRaw;
  wishSnapshot = parseWish(nextRaw);
  return wishSnapshot;
}

function emit(listeners: Set<() => void>) {
  listeners.forEach((listener) => listener());
}

function writeBag(lines: BagLine[]) {
  bagSnapshot = lines.length > 0 ? lines : EMPTY_LINES;
  bagRaw = JSON.stringify(bagSnapshot);
  window.localStorage.setItem(BAG_KEY, bagRaw);
  emit(bagListeners);
}

function writeWish(ids: string[]) {
  wishSnapshot = ids.length > 0 ? ids : EMPTY_WISH;
  wishRaw = JSON.stringify(wishSnapshot);
  window.localStorage.setItem(WISH_KEY, wishRaw);
  emit(wishListeners);
}

function subscribe(
  key: string,
  listeners: Set<() => void>,
  invalidate: () => void,
) {
  return (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) {
        invalidate();
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };
}

const subscribeBag = subscribe(BAG_KEY, bagListeners, () => {
  bagRaw = null;
});
const subscribeWish = subscribe(WISH_KEY, wishListeners, () => {
  wishRaw = null;
});

export function addToBag(input: {
  product: Product;
  color: string;
  size: string | null;
  quantity?: number;
}) {
  const product = input.product;
  if (!product.isActive) return { ok: false as const, message: "This piece is not available." };
  const variant = findVariant(product, input.size, input.color);
  if (product.variants.length > 0 && !variant) {
    return { ok: false as const, message: "Select an available size and colour." };
  }
  if (!input.size || (product.variants.length === 0 && !product.sizes.some((size) => size.label === input.size))) {
    return { ok: false as const, message: "Select an available size." };
  }
  const lines = readBag().map((line) => ({ ...line }));
  const index = lines.findIndex(
    (line) =>
      line.productId === product.id &&
      line.color === input.color &&
      line.size === input.size,
  );
  const already = index >= 0 ? lines[index].quantity : 0;
  const decision = decideBagQuantity({
    stock: sizeStock(product, input.size, input.color),
    already,
    requested: input.quantity ?? 1,
    maxPerLine: MAX_QTY,
  });
  if (!decision.ok) return decision;
  const image = mainImage(product, input.color);
  const next: BagLine = {
    productId: product.id,
    variantId: variant?.id ?? null,
    color: input.color,
    size: input.size,
    quantity: decision.quantity,
    name: product.name,
    priceInPaise: variant?.priceInPaise ?? product.priceInPaise,
    imageSrc: image?.src ?? "",
    imageAlt: image?.alt ?? product.name,
    sku: variant?.sku ?? product.sku,
    stockHint: sizeStock(product, input.size, input.color),
  };
  if (index >= 0) lines[index] = next;
  else lines.push(next);
  writeBag(lines);
  return { ok: true as const };
}

export function setBagQuantity(
  productId: string,
  color: string,
  size: string | null,
  quantity: number,
) {
  const product = getProductById(productId);
  const line = readBag().find((item) => item.productId === productId && item.color === color && item.size === size);
  const stock = product && size ? sizeStock(product, size, color) : (line?.stockHint ?? 0);
  const lines = readBag().flatMap((line) => {
    const matches =
      line.productId === productId && line.color === color && line.size === size;
    if (!matches) return [line];
    if (quantity <= 0) return [];
    const cap = Math.min(MAX_QTY, stock);
    if (cap <= 0) return [line];
    return [{ ...line, quantity: Math.min(cap, quantity) }];
  });
  writeBag(lines);
}

export function removeFromBag(
  productId: string,
  color: string,
  size: string | null,
) {
  writeBag(
    readBag().filter(
      (line) =>
        !(
          line.productId === productId &&
          line.color === color &&
          line.size === size
        ),
    ),
  );
}

export function toggleWishlist(productId: string) {
  const ids = readWish();
  writeWish(
    ids.includes(productId)
      ? ids.filter((id) => id !== productId)
      : [...ids, productId],
  );
}

export function useBag() {
  const lines = useSyncExternalStore(subscribeBag, readBag, () => EMPTY_LINES);
  const count = lines.reduce((total, line) => total + line.quantity, 0);
  return { lines, count, addToBag, setBagQuantity, removeFromBag };
}

export function useWishlist() {
  const ids = useSyncExternalStore(subscribeWish, readWish, () => EMPTY_WISH);
  return {
    ids,
    has: (productId: string) => ids.includes(productId),
    toggleWishlist,
  };
}
