"use client";

import { useState } from "react";
import { FashionImage } from "@/components/fashion-image";
import { registerProductImageAction, removeProductImageAction, reorderProductImageAction } from "@/lib/commerce/actions";
import { productImagePath, productImageUrl, validateProductImage } from "@/lib/commerce/images";
import { PRODUCT_IMAGE_BUCKET, publicSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

type ImageRow = { id: string; storagePath: string; alt: string; sortOrder: number };

export function ImageManager({ productId, images }: { productId: string; images: ImageRow[] }) {
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  async function onFile(file: File | undefined) {
    setError("");
    setMessage("");
    if (!file) return;
    const check = validateProductImage(file);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    const config = publicSupabaseConfig();
    const supabase = createSupabaseBrowser();
    if (!config || !supabase) {
      setError("Supabase is not configured.");
      return;
    }
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) {
      setError("Sign in again before uploading.");
      return;
    }
    const path = productImagePath(productId, check.extension);
    setPreview(URL.createObjectURL(file));
    setProgress(0);
    const uploaded = await uploadWithProgress(config.url, config.anonKey, token, path, file, setProgress);
    if (!uploaded) {
      setError("The upload was rejected. Only an administrator can add photographs.");
      setProgress(null);
      return;
    }
    const form = new FormData();
    form.set("productId", productId);
    form.set("path", path);
    form.set("alt", file.name);
    const result = await registerProductImageAction({}, form);
    setProgress(null);
    if (result.error) setError(result.error);
    else setMessage(result.message ?? "Photograph added.");
  }

  return (
    <section className="mt-12 border-t border-line pt-8">
      <h2 className="text-[11px] tracking-[0.16em] uppercase">Photographs</h2>
      <p className="mt-2 max-w-xl text-sm text-charcoal">JPEG, PNG, or WebP. 5 MB maximum. The first photograph is the main image.</p>
      <label className="mt-4 inline-flex h-11 cursor-pointer items-center border border-ink px-4 text-[11px] tracking-[0.16em] uppercase">
        Choose photograph
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void onFile(event.target.files?.[0])} />
      </label>
      {preview ? (
        <div className="mt-4 h-40 w-32 bg-sand bg-cover bg-center" style={{ backgroundImage: `url(${preview})` }} role="img" aria-label="Upload preview" />
      ) : null}
      {progress !== null ? <p className="mt-3 text-sm">Uploading {progress}%</p> : null}
      {error ? <p className="mt-3 text-sm" role="alert">{error}</p> : null}
      {message ? <p className="mt-3 text-sm" role="status">{message}</p> : null}
      <ul className="mt-6 space-y-3">
        {images.map((image, index) => (
          <li key={image.id} className="flex items-center gap-4 border border-line p-3">
            <div className="relative h-20 w-16 bg-sand">
              <FashionImage src={productImageUrl(image.storagePath, 160)} alt={image.alt} sizes="64px" />
            </div>
            <p className="text-sm">{index === 0 ? "Main" : `Photograph ${index + 1}`}</p>
            <form action={reorderProductImageAction}>
              <input type="hidden" name="productId" value={productId} />
              <input type="hidden" name="id" value={image.id} />
              <input type="hidden" name="direction" value="up" />
              <button type="submit" className="text-[11px] tracking-[0.14em] uppercase" disabled={index === 0}>Move up</button>
            </form>
            <form action={reorderProductImageAction}>
              <input type="hidden" name="productId" value={productId} />
              <input type="hidden" name="id" value={image.id} />
              <input type="hidden" name="direction" value="down" />
              <button type="submit" className="text-[11px] tracking-[0.14em] uppercase" disabled={index === images.length - 1}>Move down</button>
            </form>
            <form action={removeProductImageAction}>
              <input type="hidden" name="productId" value={productId} />
              <input type="hidden" name="id" value={image.id} />
              <input type="hidden" name="path" value={image.storagePath} />
              <button type="submit" className="text-[11px] tracking-[0.14em] uppercase">Remove</button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}

function uploadWithProgress(url: string, anonKey: string, token: string, path: string, file: File, onProgress: (value: number) => void) {
  return new Promise<boolean>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${url}/storage/v1/object/${PRODUCT_IMAGE_BUCKET}/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.send(file);
  });
}
