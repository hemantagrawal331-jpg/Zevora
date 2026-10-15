-- Razorpay order association.
-- A declined attempt stays awaiting payment so the customer can retry the same Razorpay order.
-- Captured payment confirms only pending_payment, and only for the stored amount.
-- This migration does not create Razorpay credentials and does not mark any order paid.

alter table public.orders add column if not exists razorpay_order_id text;
create unique index if not exists orders_razorpay_order_idx on public.orders (razorpay_order_id) where razorpay_order_id is not null;

alter table public.payments add column if not exists checkout_signature text;

create or replace function public.apply_payment_event(
  p_provider text,
  p_event_id text,
  p_order_id uuid,
  p_status text,
  p_amount integer
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id uuid;
  v_order public.orders%rowtype;
begin
  if p_provider is null or p_provider = '' or p_provider = 'unconfigured' then
    raise exception 'Payment provider is not accepted';
  end if;
  if p_status not in ('authorized', 'captured', 'failed', 'refunded') then
    raise exception 'Payment status is invalid';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then
    raise exception 'Order was not found';
  end if;
  if p_status = 'captured' and p_amount is distinct from v_order.total_in_paise then
    raise exception 'Payment amount does not match the order';
  end if;

  insert into public.payments (order_id, provider, provider_event_id, status, amount_in_paise)
  values (p_order_id, p_provider, p_event_id, p_status, p_amount)
  on conflict (provider, provider_event_id) do nothing
  returning id into inserted_id;

  if inserted_id is null then
    return 'duplicate';
  end if;

  if p_status = 'captured' and v_order.status = 'pending_payment' then
    update public.orders set status = 'confirmed', updated_at = now() where id = v_order.id;
    insert into public.order_events (order_id, status, message)
    values (v_order.id, 'confirmed', 'Payment captured.');
    return 'confirmed';
  elsif p_status = 'captured' then
    return 'refund_required';
  elsif p_status = 'failed' then
    insert into public.order_events (order_id, status, message)
    values (v_order.id, v_order.status, 'A payment attempt was declined. The order is still awaiting payment.');
    return 'recorded';
  elsif p_status = 'authorized' then
    insert into public.order_events (order_id, status, message)
    values (v_order.id, v_order.status, 'Payment authorised. It is not captured, so the order is not confirmed.');
    return 'authorized';
  elsif p_status = 'refunded' and v_order.status = 'returned' then
    update public.orders set status = 'refunded', updated_at = now() where id = v_order.id;
    insert into public.order_events (order_id, status, message)
    values (v_order.id, 'refunded', 'Refund recorded.');
    return 'refunded';
  end if;

  return 'recorded';
end;
$$;

revoke all on function public.apply_payment_event(text, text, uuid, text, integer) from public;
grant execute on function public.apply_payment_event(text, text, uuid, text, integer) to service_role;
