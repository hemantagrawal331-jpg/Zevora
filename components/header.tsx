"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { FashionImage } from "@/components/fashion-image";
import {
  AccountIcon,
  BagIcon,
  CloseIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
} from "@/components/icons";
import { useBag, useWishlist } from "@/components/store";
import { isNavCurrent, navigation, type NavItem } from "@/lib/navigation";
import { site } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  return <HeaderBar key={pathname} />;
}

function HeaderBar() {
  const pathname = usePathname();
  const bag = useBag();
  const wishlist = useWishlist();
  const [menu, setMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const active = navigation.find((item) => item.label === menu) ?? null;

  return (
    <div
      className="relative"
      onMouseLeave={() => setMenu(null)}
      onKeyDown={(event) => {
        if (event.key === "Escape") setMenu(null);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setMenu(null);
        }
      }}
    >
      <header className="border-b border-line bg-ivory">
        <div className="relative mx-auto flex h-16 max-w-[1600px] items-center px-4 sm:px-6 lg:h-[4.5rem] lg:px-10">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => {
              setSearchOpen(false);
              setMobileOpen(true);
            }}
          >
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </button>

          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 text-[13px] font-medium tracking-[0.28em] uppercase sm:text-[15px] sm:tracking-[0.42em] lg:static lg:translate-x-0"
          >
            {site.name}
          </Link>

          <nav aria-label="Primary" className="ml-14 hidden lg:block">
            <ul className="flex items-center gap-5">
              {navigation.map((item) => {
                const open = menu === item.label;
                const current = isNavCurrent(item.href, pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-expanded={open}
                      aria-haspopup="true"
                      aria-current={current ? "page" : undefined}
                      onMouseEnter={() => setMenu(item.label)}
                      onFocus={() => setMenu(item.label)}
                      className={`py-6 text-[11px] tracking-[0.18em] uppercase ${
                        open || current ? "text-ink" : "text-charcoal hover:text-ink"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="ml-auto flex items-center">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center"
              aria-expanded={searchOpen}
              aria-controls="site-search"
              onClick={() => {
                setMenu(null);
                setMobileOpen(false);
                setSearchOpen(true);
              }}
            >
              <SearchIcon className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </button>
            <Link
              href="/account"
              className="hidden h-10 w-10 items-center justify-center sm:flex"
              aria-label="Account"
            >
              <AccountIcon className="h-5 w-5" />
            </Link>
            <Link
              href="/wishlist"
              className="relative flex h-10 w-10 items-center justify-center"
              aria-label={
                wishlist.ids.length
                  ? `Wishlist, ${wishlist.ids.length} saved`
                  : "Wishlist"
              }
            >
              <HeartIcon className="h-5 w-5" />
              {wishlist.ids.length > 0 ? (
                <span className="absolute top-1 right-0 text-[10px] tracking-wide">
                  {wishlist.ids.length}
                </span>
              ) : null}
            </Link>
            <Link
              href="/bag"
              className="relative flex h-10 w-10 items-center justify-center"
              aria-label={
                bag.count === 1 ? "Shopping bag, 1 item" : `Shopping bag, ${bag.count} items`
              }
            >
              <BagIcon className="h-5 w-5" />
              <span className="absolute top-1 right-0 min-w-3 text-[10px] tracking-wide">
                {bag.count}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {active ? <MegaMenu item={active} onNavigate={() => setMenu(null)} /> : null}
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

export function HeaderFallback() {
  return (
    <header className="border-b border-line bg-ivory">
      <div className="relative mx-auto flex h-16 max-w-[1600px] items-center px-4 sm:px-6 lg:h-[4.5rem] lg:px-10">
        <span className="absolute left-1/2 -translate-x-1/2 text-[13px] font-medium tracking-[0.28em] uppercase sm:text-[15px] sm:tracking-[0.42em] lg:static lg:translate-x-0">
          {site.name}
        </span>
      </div>
    </header>
  );
}

function MegaMenu({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  return (
    <div className="absolute top-full right-0 left-0 z-30 hidden border-b border-line bg-ivory lg:block">
      <div className="mx-auto grid max-w-[1600px] grid-cols-[1fr_280px] gap-12 px-10 py-10">
        <div className="grid grid-cols-3 gap-10">
          {item.columns.map((column) => (
            <div key={column.title}>
              <p className="text-[11px] tracking-[0.18em] text-stone uppercase">{column.title}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onNavigate}
                      className="text-sm text-charcoal hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Link href={item.feature.href} onClick={onNavigate} className="group block">
          <div className="relative aspect-[4/5] overflow-hidden bg-sand">
            <FashionImage
              src={item.feature.image}
              alt={item.feature.alt}
              sizes="280px"
              className="transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transform-none"
            />
          </div>
          <p className="mt-3 text-[11px] tracking-[0.18em] uppercase">{item.feature.caption}</p>
        </Link>
      </div>
    </div>
  );
}

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [section, setSection] = useState<string | null>(navigation[0]?.label ?? null);
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const root = ref.current;
    if (!root) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );

    focusable()[0]?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        ref={ref}
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex h-full flex-col bg-ivory"
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <p id={titleId} className="text-[15px] font-medium tracking-[0.42em] uppercase">
            {site.name}
          </p>
          <button type="button" className="flex h-10 w-10 items-center justify-center" onClick={onClose}>
            <CloseIcon className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </button>
        </div>
        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-4 py-4">
          <ul>
            {navigation.map((item) => {
              const expanded = section === item.label;
              const panelId = `mobile-${item.label.replace(/\s+/g, "-").toLowerCase()}`;
              return (
                <li key={item.href} className="border-b border-line">
                  <div className="flex items-center justify-between">
                    <Link
                      href={item.href}
                      aria-current={isNavCurrent(item.href, pathname) ? "page" : undefined}
                      onClick={onClose}
                      className="py-4 text-sm tracking-[0.16em] uppercase"
                    >
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      className="px-2 py-4 text-xs tracking-[0.14em] text-stone uppercase"
                      onClick={() => setSection(expanded ? null : item.label)}
                    >
                      {expanded ? "Hide" : "Show"}
                    </button>
                  </div>
                  {expanded ? (
                    <div id={panelId} className="pb-4">
                      {item.columns.map((column) => (
                        <div key={column.title} className="mb-4">
                          <p className="text-[11px] tracking-[0.16em] text-stone uppercase">{column.title}</p>
                          <ul className="mt-2 space-y-2">
                            {column.links.map((link) => (
                              <li key={link.href}>
                                <Link href={link.href} onClick={onClose} className="text-sm text-charcoal">
                                  {link.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <ul className="mt-6 space-y-3 text-sm">
            <li>
              <Link href="/account" onClick={onClose}>
                Account
              </Link>
            </li>
            <li>
              <Link href="/wishlist" onClick={onClose}>
                Wishlist
              </Link>
            </li>
            <li>
              <Link href="/support" onClick={onClose}>
                Customer support
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-ink/30" onMouseDown={() => onClose()}>
      <div
        ref={ref}
        id="site-search"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-ivory"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <form action="/search" className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:h-[4.5rem] lg:px-10">
          <h2 id={titleId} className="sr-only">
            Search the collection
          </h2>
          <SearchIcon className="h-5 w-5 shrink-0" />
          <input
            ref={inputRef}
            name="q"
            type="search"
            placeholder="Search jeans, hoodies, bags"
            aria-label="Search"
            className="h-full w-full bg-transparent text-base outline-none placeholder:text-stone"
          />
          <button type="submit" className="text-[11px] tracking-[0.16em] uppercase">
            Search
          </button>
          <button type="button" onClick={onClose} className="text-[11px] tracking-[0.16em] uppercase">
            Close
          </button>
        </form>
      </div>
    </div>
  );
}
