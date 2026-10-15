export const checkoutDefaults = {
  freeShippingAbovePaise: 500_000,
  shippingPaise: 15_000,
  taxRateBps: 500,
  taxInclusive: true,
  maxQuantity: 5,
} as const;

export type CheckoutRules = {
  freeShippingAbovePaise: number;
  shippingPaise: number;
  taxRateBps: number;
  taxInclusive: boolean;
  maxQuantity: number;
};

export type QuoteLineInput = {
  variantId: string;
  name: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unitPriceInPaise: number;
  compareAtPriceInPaise?: number | null;
  stockQuantity: number;
  available: boolean;
};

export type CouponRule = {
  code: string;
  type: "percent" | "fixed";
  amount: number;
  minSubtotalInPaise: number;
  active: boolean;
};

export type CheckoutQuote = {
  lines: { name: string; sku: string; size: string; color: string; quantity: number; unitPriceInPaise: number; lineDiscountInPaise: number }[];
  subtotalInPaise: number;
  merchandiseDiscountInPaise: number;
  couponDiscountInPaise: number;
  shippingInPaise: number;
  taxInPaise: number;
  taxRateBps: number;
  taxInclusive: boolean;
  payableInPaise: number;
  couponCode: string | null;
};

export function authoritativeUnitPrice(databasePriceInPaise: number) {
  if (!Number.isInteger(databasePriceInPaise) || databasePriceInPaise <= 0) {
    return { ok: false as const, message: "A catalogue price is missing." };
  }
  return { ok: true as const, priceInPaise: databasePriceInPaise };
}

export function quoteCheckout(
  lines: QuoteLineInput[],
  coupon: CouponRule | null,
  rules: CheckoutRules = checkoutDefaults,
): { ok: true; quote: CheckoutQuote } | { ok: false; message: string } {
  if (lines.length < 1 || lines.length > 20) return { ok: false, message: "Choose between 1 and 20 pieces." };
  const seen = new Set<string>();
  let subtotal = 0;
  let merchandiseDiscount = 0;
  const quoted = [];
  for (const line of lines) {
    if (seen.has(line.variantId)) return { ok: false, message: "A piece was included twice." };
    seen.add(line.variantId);
    if (!line.available) return { ok: false, message: `${line.name} is not available.` };
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > rules.maxQuantity) {
      return { ok: false, message: `Choose a quantity from 1 to ${rules.maxQuantity} for ${line.name}.` };
    }
    const price = authoritativeUnitPrice(line.unitPriceInPaise);
    if (!price.ok) return price;
    if (!Number.isInteger(line.stockQuantity) || line.stockQuantity < line.quantity) {
      return { ok: false, message: `${line.name} does not have enough stock.` };
    }
    const compare = line.compareAtPriceInPaise;
    const lineDiscount =
      compare && Number.isInteger(compare) && compare > price.priceInPaise
        ? (compare - price.priceInPaise) * line.quantity
        : 0;
    subtotal += price.priceInPaise * line.quantity;
    merchandiseDiscount += lineDiscount;
    quoted.push({
      name: line.name,
      sku: line.sku,
      size: line.size,
      color: line.color,
      quantity: line.quantity,
      unitPriceInPaise: price.priceInPaise,
      lineDiscountInPaise: lineDiscount,
    });
  }
  if (subtotal <= 0) return { ok: false, message: "The order total is not valid." };

  let couponDiscount = 0;
  let couponCode: string | null = null;
  if (coupon) {
    if (!coupon.active) return { ok: false, message: "That coupon is not active." };
    if (subtotal < coupon.minSubtotalInPaise) {
      return { ok: false, message: "This order does not meet the coupon minimum." };
    }
    if (coupon.type === "percent") {
      if (!Number.isInteger(coupon.amount) || coupon.amount <= 0 || coupon.amount > 10000) {
        return { ok: false, message: "That coupon is not valid." };
      }
      couponDiscount = Math.floor((subtotal * coupon.amount) / 10000);
    } else {
      if (!Number.isInteger(coupon.amount) || coupon.amount <= 0) return { ok: false, message: "That coupon is not valid." };
      couponDiscount = Math.min(coupon.amount, subtotal);
    }
    couponCode = coupon.code;
  }
  const discounted = subtotal - couponDiscount;
  const shipping = discounted >= rules.freeShippingAbovePaise ? 0 : rules.shippingPaise;
  const tax = rules.taxInclusive
    ? Math.round((discounted * rules.taxRateBps) / (10000 + rules.taxRateBps))
    : Math.round((discounted * rules.taxRateBps) / 10000);
  const payable = rules.taxInclusive ? discounted + shipping : discounted + shipping + tax;
  if (payable <= 0) return { ok: false, message: "The payable amount is not valid." };
  return {
    ok: true,
    quote: {
      lines: quoted,
      subtotalInPaise: subtotal,
      merchandiseDiscountInPaise: merchandiseDiscount,
      couponDiscountInPaise: couponDiscount,
      shippingInPaise: shipping,
      taxInPaise: tax,
      taxRateBps: rules.taxRateBps,
      taxInclusive: rules.taxInclusive,
      payableInPaise: payable,
      couponCode,
    },
  };
}
