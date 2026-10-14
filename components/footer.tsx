import Link from "next/link";
import { Container } from "@/components/container";
import { footerNavigation } from "@/lib/navigation";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-line bg-ivory">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase">Customer support</p>
          <ul className="mt-4 space-y-2.5 text-sm text-charcoal">
            {footerNavigation.support.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase">The house</p>
          <ul className="mt-4 space-y-2.5 text-sm text-charcoal">
            {footerNavigation.company.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase">Legal</p>
          <ul className="mt-4 space-y-2.5 text-sm text-charcoal">
            {footerNavigation.legal.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-6 space-y-2.5 text-sm text-charcoal">
            {site.social.map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noreferrer" className="hover:text-ink">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase">Contact</p>
          <address className="mt-4 space-y-2 text-sm leading-6 text-charcoal not-italic">
            <p>{site.contact.address}</p>
            <p>
              <a href={`mailto:${site.contact.email}`} className="hover:text-ink">
                {site.contact.email}
              </a>
            </p>
            <p>
              <a href={`tel:${site.contact.phone.replace(/\s/g, "")}`} className="hover:text-ink">
                {site.contact.phone}
              </a>
            </p>
            <p>{site.contact.hours}</p>
          </address>
        </div>
      </Container>
      <div className="border-t border-line">
        <Container className="flex flex-col gap-2 py-5 text-[11px] tracking-[0.14em] text-stone uppercase sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 ZEVORA</p>
          <p>Clothing and accessories, India</p>
        </Container>
      </div>
    </footer>
  );
}
