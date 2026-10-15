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
        Complimentary shipping applies to orders of ₹5,000 and above. Below that, checkout adds a flat shipping charge of ₹150. Listed prices include GST at 5%. Both are calculated on the server when an order is created. This page does not quote a live carrier rate.
      </p>
      <p>Standard delivery is 4–7 working days in metros, and up to 10 working days elsewhere. Remote pin codes can take longer.</p>
      <p>A signed-in bag is stored with the account. A guest bag stays in this browser until sign-in, when catalogue pieces are merged. Stock is reserved only when an order is created, and only for catalogue pieces.</p>
    </InfoPage>
  );
}
