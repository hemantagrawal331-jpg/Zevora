import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "The House",
  description: "How ZEVORA approaches clothing and accessories.",
};

export default function AboutPage() {
  return (
    <InfoPage eyebrow="The house" title="Style that speaks for itself">
      <p>
        ZEVORA is a clothing and accessories house for menswear, womenswear, and the pieces that finish them. The work is cut in India and meant to be worn on ordinary days.
      </p>
      <p>
        We keep the palette quiet: ivory, black, camel, navy, and stone. The clothes should read clearly in a photograph and more clearly in person — a coat with a straight hem, a knit with a firm gauge, a bag that does not announce itself.
      </p>
      <p>
        This website is the storefront foundation. Product photography in the edit is a stand-in, ready to be replaced with the house’s own pictures. Payments, accounts, and email are not connected.
      </p>
    </InfoPage>
  );
}
