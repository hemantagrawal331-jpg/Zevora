import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for using the ZEVORA storefront preview.",
};

export default function TermsPage() {
  return (
    <InfoPage eyebrow="Legal" title="Terms">
      <p>
        Adding a piece to the bag does not reserve it. An order can be created from catalogue stock and stays unpaid until a verified payment event. Opening the confirmation page does not mark an order paid. Sample catalogue pieces cannot be ordered.
      </p>
      <p>
        Product photographs are temporary stand-ins. They are not a claim that the pictured garment was made by ZEVORA. Names describe the piece in the photograph so the layout can be reviewed.
      </p>
      <p>
        Shipping, returns, and privacy pages describe the rules used at checkout. An unpaid order is not a completed sale.
      </p>
    </InfoPage>
  );
}
