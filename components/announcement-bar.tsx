import Link from "next/link";
import { site } from "@/lib/site";

export function AnnouncementBar() {
  return (
    <div className="bg-ink text-ivory">
      <Link
        href={site.announcement.href}
        className="flex h-9 items-center justify-center px-4 text-center text-[11px] tracking-[0.18em] uppercase hover:text-sand"
      >
        {site.announcement.text}
      </Link>
    </div>
  );
}
