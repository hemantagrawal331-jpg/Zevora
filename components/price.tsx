import { formatPrice, salePercent } from "@/lib/format";

export function Price({
  price,
  compareAtPrice,
  className = "",
}: {
  price: number;
  compareAtPrice?: number;
  className?: string;
}) {
  const discount =
    compareAtPrice && compareAtPrice > price
      ? salePercent(price, compareAtPrice)
      : 0;

  return (
    <p className={`text-sm text-ink ${className}`}>
      <span>{formatPrice(price)}</span>
      {discount > 0 && compareAtPrice ? (
        <>
          <span className="ml-2 text-stone line-through">
            {formatPrice(compareAtPrice)}
          </span>
          <span className="ml-2 text-stone">{discount}% off</span>
        </>
      ) : null}
    </p>
  );
}
