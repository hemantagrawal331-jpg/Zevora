import { formatPrice } from "@/lib/format";

export function OrderTotals({
  subtotalInPaise,
  merchandiseDiscountInPaise,
  couponDiscountInPaise,
  couponCode,
  shippingInPaise,
  taxInPaise,
  taxRateBps,
  taxInclusive,
  payableInPaise,
}: {
  subtotalInPaise: number;
  merchandiseDiscountInPaise: number;
  couponDiscountInPaise: number;
  couponCode?: string | null;
  shippingInPaise: number;
  taxInPaise: number;
  taxRateBps: number;
  taxInclusive: boolean;
  payableInPaise: number;
}) {
  const rows = [
    ["Subtotal", formatPrice(subtotalInPaise)],
    merchandiseDiscountInPaise > 0 ? ["Price reduction", formatPrice(merchandiseDiscountInPaise)] : null,
    couponDiscountInPaise > 0 ? [`Coupon${couponCode ? ` ${couponCode}` : ""}`, `−${formatPrice(couponDiscountInPaise)}`] : null,
    ["Shipping", shippingInPaise === 0 ? "Complimentary" : formatPrice(shippingInPaise)],
    [`GST ${taxRateBps / 100}%${taxInclusive ? ", included" : ""}`, formatPrice(taxInPaise)],
  ].filter((row) => row !== null);
  return (
    <dl className="space-y-3 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4">
          <dt className="text-charcoal">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
      <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <dt>Payable</dt>
        <dd className="font-display text-2xl">{formatPrice(payableInPaise)}</dd>
      </div>
    </dl>
  );
}
