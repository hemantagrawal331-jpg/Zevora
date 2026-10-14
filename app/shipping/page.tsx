import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Shipping",
  description: "Shipping within India from ZEVORA.",
};

export default function ShippingPage() {
  return (
    <InfoPage eyebrow="Delivery" title="Shipping">
      <p>Orders are prepared in Mumbai and shipped within India.</p>
      <p>
        Complimentary shipping applies to orders of ₹5,000 and above. Below that, a flat shipping charge of ₹250 is added when checkout is connected. This preview does not calculate a live carrier rate and does not place orders.
      </p>
      <p>Standard delivery is 4–7 working days in metros, and up to 10 working days elsewhere. Remote pin codes can take longer.</p>
      <p>You will receive a dispatch note by email once order mail is connected. Until then, the bag on this site is stored only in your browser.</p>
    </InfoPage>
  );
}
