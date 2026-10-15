export function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercel = process.env.VERCEL_URL?.trim();
  const candidate = configured || (vercel ? `https://${vercel.replace(/^https?:\/\//, "")}` : "http://localhost:3000");
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "http://localhost:3000";
    return url.origin;
  } catch {
    return "http://localhost:3000";
  }
}

export const privatePageRobots = { index: false, follow: false } as const;

export const site = {
  name: "ZEVORA",
  description:
    "ZEVORA is a modern clothing and accessories house in India. Menswear, womenswear, and accessories in quiet fabrics.",
  announcement: {
    text: "Complimentary shipping on orders above ₹5,000",
    href: "/shipping",
  },
  contact: {
    email: "hello@zevora.in",
    phone: "+91 22 4000 1800",
    hours: "Monday to Saturday, 10:00–18:00 IST",
    address: "Bandra West, Mumbai 400050, India",
  },
  social: [
    { label: "Instagram", href: "https://www.instagram.com/" },
    { label: "Pinterest", href: "https://www.pinterest.com/" },
  ],
} as const;
