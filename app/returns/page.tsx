import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Returns",
  description: "Returns and exchanges at ZEVORA.",
};

export default function ReturnsPage() {
  return (
    <InfoPage eyebrow="Aftercare" title="Returns">
      <p>Unworn pieces with tags attached can be returned within 14 days of delivery. Earrings and intimates, when they are added to the edit, are final sale.</p>
      <p>Sale pieces can be returned, not exchanged, unless a size is faulty. Refunds go back to the original payment method once payments exist. This preview cannot start a return.</p>
      <p>
        To ask about a piece, write to{" "}
        <a className="underline" href={`mailto:${site.contact.email}`}>
          {site.contact.email}
        </a>{" "}
        with the order number. There is no returns portal yet.
      </p>
    </InfoPage>
  );
}
