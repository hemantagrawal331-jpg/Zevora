import { MAX_IMAGE_BYTES, PRODUCT_IMAGE_BUCKET, publicSupabaseConfig } from "@/lib/supabase/config";

const types = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export function validateProductImage(file: { type: string; size: number }) {
  const extension = types[file.type as keyof typeof types];
  if (!extension) return { ok: false as const, message: "Use a JPEG, PNG, or WebP photograph." };
  if (!Number.isInteger(file.size) || file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    return { ok: false as const, message: "Each photograph must be 5 MB or smaller." };
  }
  return { ok: true as const, extension };
}

export function productImagePath(productId: string, extension: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId)) {
    throw new Error("Invalid product id.");
  }
  if (extension !== "jpg" && extension !== "png" && extension !== "webp") {
    throw new Error("Invalid image type.");
  }
  return `products/${productId}/${crypto.randomUUID()}.${extension}`;
}

export function isSafeImagePath(productId: string, path: string) {
  return new RegExp(
    `^products/${productId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`,
    "i",
  ).test(path);
}

export function productImageUrl(path: string, width?: number) {
  const config = publicSupabaseConfig();
  if (!config) return "";
  const clean = path.replace(/^\/+/, "");
  const transforms = process.env.SUPABASE_IMAGE_TRANSFORMS === "true" && width;
  if (transforms) {
    return `${config.url}/storage/v1/render/image/public/${PRODUCT_IMAGE_BUCKET}/${clean}?width=${width}&quality=75`;
  }
  return `${config.url}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${clean}`;
}
