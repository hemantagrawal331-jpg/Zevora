import { formatPrice, salePercent } from "@/lib/format";

export function Price({
  priceInPaise,
  compareAtPriceInPaise,
  className = "",
}: {
  priceInPaise: number;
  compareAtPriceInPaise?: number;
  className?: string;
}) {
  const discount =
    compareAtPriceInPaise && compareAtPriceInPaise > priceInPaise
      ? salePercent(priceInPaise, compareAtPriceInPaise)
      : 0;

  return (
    <p className={`text-sm text-ink ${className}`}>
      <span>{formatPrice(priceInPaise)}</span>
      {discount > 0 && compareAtPriceInPaise ? (
        <>
          <span className="ml-2 text-stone line-through">{formatPrice(compareAtPriceInPaise)}</span>
          <span className="ml-2 text-stone">{discount}% off</span>
        </>
      ) : null}
    </p>
  );
}
