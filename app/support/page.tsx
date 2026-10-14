import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Customer Support",
  description: "Help with orders, shipping, and returns at ZEVORA.",
};

export default function SupportPage() {
  return (
    <InfoPage eyebrow="Help" title="Customer support">
      <p>
        Write to{" "}
        <a className="underline" href={`mailto:${site.contact.email}`}>
          {site.contact.email}
        </a>{" "}
        or call {site.contact.phone}, {site.contact.hours}. There is no ticket system connected on this site.
      </p>
      <p>Questions we can already answer are collected here:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <Link href="/shipping" className="underline">
            Shipping
          </Link>{" "}
          — complimentary above ₹5,000 within India.
        </li>
        <li>
          <Link href="/returns" className="underline">
            Returns
          </Link>{" "}
          — 14 days, unworn, with tags.
        </li>
        <li>
          <Link href="/contact" className="underline">
            Contact
          </Link>{" "}
          — a form that stays in this browser until an inbox is connected.
        </li>
      </ul>
    </InfoPage>
  );
}
