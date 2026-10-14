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
        This website is a storefront preview for ZEVORA. Prices are shown in Indian rupees so the edit can be read as a shop. Adding a piece to the bag does not reserve it, and checkout cannot be completed.
      </p>
      <p>
        Product photographs are temporary stand-ins. They are not a claim that the pictured garment was made by ZEVORA. Names describe the piece in the photograph so the layout can be reviewed.
      </p>
      <p>
        Shipping and returns pages describe the intended policy. They are not a contract for an order, because orders cannot be placed here yet.
      </p>
    </InfoPage>
  );
}
