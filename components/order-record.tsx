import Link from "next/link";
import { Container } from "@/components/container";
import { OrderActions } from "@/components/order-actions";
import { PayOrder } from "@/components/pay-order";
import { OrderTotals } from "@/components/order-totals";
import { describePayment } from "@/lib/commerce/checkout-input";
import type { OrderView } from "@/lib/commerce/load-order";
import { customerCanCancel, customerCanRequestReturn, fulfilmentLabels, isFulfilmentStatus } from "@/lib/commerce/order-states";
import { formatPrice } from "@/lib/format";

export function OrderRecord({ order, canPay }: { order: OrderView; canPay: boolean }) {
  const payment = describePayment(order.payments);
  const fulfilment = isFulfilmentStatus(order.status) ? fulfilmentLabels[order.status] : order.status;
  const address = order.address;
  return (
    <Container className="max-w-3xl py-12">
      <p className="text-[11px] tracking-[0.2em] text-stone uppercase">Order {order.reference}</p>
      <h1 className="mt-3 font-display text-5xl md:text-6xl">{fulfilment}</h1>
      <p className="mt-4 text-sm leading-6 text-charcoal">
        Payment: {payment}. Refreshing this page shows the payment status verified by the server.
      </p>
      {order.status === "pending_payment" ? (
        <p className="mt-3 text-sm leading-6">This order is awaiting payment. A declined attempt can be retried. This page does not mark the order paid.</p>
      ) : null}
      {canPay && order.status === "pending_payment" ? <PayOrder reference={order.reference} /> : null}
      {order.status === "payment_failed" ? (
        <p className="mt-3 text-sm leading-6">The payment failed, so this order was not confirmed. <Link className="underline" href="/shop">Continue shopping</Link> to try again.</p>
      ) : null}
      <h2 className="mt-10 text-[11px] tracking-[0.16em] uppercase">Timeline</h2>
      <ol className="mt-4 space-y-3 border-l border-line pl-4">
        {order.events.length === 0 ? <li className="text-sm">{fulfilment}</li> : null}
        {order.events.map((event) => (
          <li key={`${event.createdAt}-${event.status}`} className="text-sm">
            <p>{isFulfilmentStatus(event.status) ? fulfilmentLabels[event.status] : event.status}</p>
            <p className="text-xs text-stone">{event.message} · {new Date(event.createdAt).toLocaleString("en-IN")}</p>
          </li>
        ))}
      </ol>
      <h2 className="mt-10 text-[11px] tracking-[0.16em] uppercase">Pieces</h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {order.items.map((item) => (
          <li key={item.id} className="py-4 text-sm">
            <p>{item.productName}</p>
            <p className="text-xs text-stone">{item.variantLabel} · {item.sku} · Qty {item.quantity} · {formatPrice(item.unitPriceInPaise)}</p>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <OrderTotals
          subtotalInPaise={order.subtotalInPaise}
          merchandiseDiscountInPaise={0}
          couponDiscountInPaise={order.discountInPaise}
          couponCode={order.couponCode}
          shippingInPaise={order.shippingInPaise}
          taxInPaise={order.taxInPaise}
          taxRateBps={order.taxRateBps}
          taxInclusive={order.taxInclusive}
          payableInPaise={order.totalInPaise}
        />
      </div>
      <h2 className="mt-10 text-[11px] tracking-[0.16em] uppercase">Delivery</h2>
      <p className="mt-3 text-sm leading-6">
        {order.contactName || address.fullName}<br />
        {address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />
        {address.city}, {address.state} {address.postalCode}<br />
        {order.contactPhone} · {order.contactEmail}
      </p>
      <OrderActions
        reference={order.reference}
        canCancel={customerCanCancel(order.status)}
        canReturn={customerCanRequestReturn(order.status, order.deliveredAt, undefined, order.returnWindowDays)}
      />
      <p className="mt-10 text-sm"><Link className="underline" href="/account/orders">Order history</Link></p>
    </Container>
  );
}
