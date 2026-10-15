import type { Metadata } from "next";
import { privatePageRobots } from "@/lib/site";

export const metadata: Metadata = {
  robots: privatePageRobots,
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
