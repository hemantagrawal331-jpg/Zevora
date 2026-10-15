import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product-grid";
import { WishlistView } from "@/components/wishlist-view";
import { Container } from "@/components/container";
import { loadStorefront } from "@/lib/commerce/catalogue";
import { getCatalogueProfile } from "@/lib/commerce/session";
import { createSupabaseServer } from "@/lib/supabase/server";
import { privatePageRobots } from "@/lib/site";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Pieces saved from the ZEVORA edit.",
  robots: privatePageRobots,
};

export default function WishlistPage() {
  return (
    <Suspense fallback={<WishlistView />}>
      <WishlistContent />
    </Suspense>
  );
}

async function WishlistContent() {
  const profile = await getCatalogueProfile();
  if (!profile) return <WishlistView />;
  const supabase = await createSupabaseServer();
  const wishlist = supabase ? await supabase.from("wishlists").select("id").eq("user_id", profile.id).maybeSingle() : { data: null };
  const wishlistId = (wishlist.data as { id: string } | null)?.id;
  const items = wishlistId && supabase
    ? await supabase.from("wishlist_items").select("product_id").eq("wishlist_id", wishlistId)
    : { data: [] };
  const ids = new Set(((items.data as { product_id: string }[] | null) ?? []).map((item) => item.product_id));
  const loaded = await loadStorefront();
  const products = loaded.products.filter((product) => ids.has(product.id));
  return (
    <Container className="py-10">
      <h1 className="font-display text-5xl">Wishlist</h1>
      <p className="mt-3 text-sm text-charcoal">Saved to your account. Pieces saved only in this browser stay on the device until you sign in and tap the heart again.</p>
      <div className="mt-8">
        {products.length > 0 ? <ProductGrid products={products} /> : <p className="text-sm">No saved pieces yet.</p>}
      </div>
    </Container>
  );
}
