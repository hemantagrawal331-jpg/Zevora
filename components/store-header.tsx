import { Header } from "@/components/header";
import { loadNavigationItems } from "@/lib/commerce/catalogue";

export async function StoreHeader() {
  const items = await loadNavigationItems();
  return <Header items={items} />;
}
