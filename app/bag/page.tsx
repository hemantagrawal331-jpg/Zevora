import type { Metadata } from "next";
import { BagView } from "@/components/bag-view";

export const metadata: Metadata = {
  title: "Bag",
  description: "Review pieces in your ZEVORA bag.",
};

export default function BagPage() {
  return <BagView />;
}
