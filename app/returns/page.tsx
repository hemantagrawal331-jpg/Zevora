import { InfoPage } from "@/components/info-page";
import { publicPage } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = publicPage("/returns", "Returns", "Returns and exchanges at ZEVORA.");

export default function ReturnsPage() {
  return (
    <InfoPage eyebrow="Aftercare" title="Returns">
      <p>Unworn pieces with tags attached can be returned within 14 days of delivery. Earrings and intimates, when they are added to the edit, are final sale.</p>
      <p>A delivered catalogue order can request a return from the order page within 14 days of delivery. The request does not refund a payment. A refund is recorded only when a verified payment event says the payment was refunded.</p>
      <p>
        To ask about a piece, write to{" "}
        <a className="underline" href={`mailto:${site.contact.email}`}>
          {site.contact.email}
        </a>{" "}
        with the order reference.
      </p>
    </InfoPage>
  );
}
