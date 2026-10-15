import Link from "next/link";

const links = [
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/sourcing", label: "Sourcing" },
];

export function CatalogueShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <p className="text-[12px] tracking-[0.28em] uppercase">ZEVORA catalogue</p>
          <nav className="flex flex-wrap gap-4 text-[11px] tracking-[0.16em] uppercase">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:underline">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-5xl">{title}</h1>
        {children}
      </main>
    </div>
  );
}

export function AdminMessage({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null;
  return (
    <p className="mt-4 text-sm" role={error ? "alert" : "status"}>
      {error ?? message}
    </p>
  );
}
