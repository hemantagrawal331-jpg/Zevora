-- Checkout fields, coupons, and order states.
-- Prices are calculated inside the database. The browser cannot set them.
-- Applying this does not configure Razorpay and does not mark any order paid.

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (
  status in (
    'pending_payment', 'confirmed', 'processing', 'shipped', 'delivered',
    'payment_failed', 'cancelled', 'return_requested', 'returned', 'refunded',
    'pending', 'packed'
  )
);

alter table public.orders alter column user_id drop not null;
alter table public.orders add column if not exists reference text;
alter table public.orders add column if not exists idempotency_key text;
alter table public.orders add column if not exists contact_email text;
alter table public.orders add column if not exists contact_name text;
alter table public.orders add column if not exists contact_phone text;
alter table public.orders add column if not exists discount_in_paise integer not null default 0 check (discount_in_paise >= 0);
alter table public.orders add column if not exists tax_in_paise integer not null default 0 check (tax_in_paise >= 0);
alter table public.orders add column if not exists tax_rate_bps integer not null default 500;
alter table public.orders add column if not exists tax_inclusive boolean not null default true;
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists access_token_hash text;
alter table public.orders add column if not exists delivered_at timestamptz;

create unique index if not exists orders_reference_idx on public.orders (reference);
create unique index if not exists orders_idempotency_idx on public.orders (idempotency_key);

update public.orders set reference = 'ZV' || upper(substr(replace(id::text, '-', ''), 1, 8)) where reference is null;
update public.orders set status = 'pending_payment' where status = 'pending';
update public.orders set status = 'processing' where status = 'packed';

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (
  status in (
    'pending_payment', 'confirmed', 'processing', 'shipped', 'delivered',
    'payment_failed', 'cancelled', 'return_requested', 'returned', 'refunded'
  )
);

alter table public.orders alter column reference set not null;

create table if not exists public.checkout_settings (
  id integer primary key check (id = 1),
  free_shipping_above_paise integer not null check (free_shipping_above_paise >= 0),
  shipping_paise integer not null check (shipping_paise >= 0),
  tax_rate_bps integer not null check (tax_rate_bps between 0 and 10000),
  tax_inclusive boolean not null,
  return_window_days integer not null check (return_window_days between 0 and 60)
);

insert into public.checkout_settings (
  id, free_shipping_above_paise, shipping_paise, tax_rate_bps, tax_inclusive, return_window_days
) values (1, 500000, 15000, 500, true, 14)
on conflict (id) do nothing;

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9-]{3,24}$'),
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  amount integer not null check (amount > 0),
  min_subtotal_in_paise integer not null default 0 check (min_subtotal_in_paise >= 0),
  is_active boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

alter table public.coupons enable row level security;
alter table public.order_events enable row level security;
alter table public.checkout_settings enable row level security;

drop policy if exists coupons_admin on public.coupons;
create policy coupons_admin on public.coupons
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists order_events_read on public.order_events;
create policy order_events_read on public.order_events
for select to authenticated
using (
  exists (
    select 1 from public.orders
    where orders.id = order_id and (orders.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists checkout_settings_read on public.checkout_settings;
create policy checkout_settings_read on public.checkout_settings
for select to anon, authenticated
using (true);

create or replace function public.create_checkout_order(
  p_user uuid,
  p_email text,
  p_name text,
  p_phone text,
  p_address jsonb,
  p_items jsonb,
  p_coupon text,
  p_idempotency text,
  p_access_token_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.orders%rowtype;
  v_order uuid := gen_random_uuid();
  v_reference text;
  v_seen uuid[] := '{}';
  v_item jsonb;
  v_variant public.product_variants%rowtype;
  v_product_name text;
  v_qty integer;
  v_subtotal integer := 0;
  v_coupon_discount integer := 0;
  v_shipping integer;
  v_tax integer;
  v_payable integer;
  v_settings public.checkout_settings%rowtype;
  v_coupon public.coupons%rowtype;
  v_count integer := 0;
  v_discounted integer;
begin
  if p_idempotency is null or char_length(p_idempotency) < 16 then
    raise exception 'Checkout could not be identified';
  end if;
  select * into existing from public.orders where idempotency_key = p_idempotency;
  if existing.id is not null then
    if existing.contact_email is distinct from lower(p_email) then
      raise exception 'This checkout was already used';
    end if;
    return jsonb_build_object('reference', existing.reference, 'duplicate', true, 'status', existing.status);
  end if;
  if p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Enter a valid email address';
  end if;
  if p_name is null or char_length(trim(p_name)) < 1 then
    raise exception 'Enter your name';
  end if;
  if p_phone !~ '^[6-9][0-9]{9}$' then
    raise exception 'Enter a 10-digit mobile number';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 20 then
    raise exception 'Choose between 1 and 20 pieces';
  end if;
  select * into v_settings from public.checkout_settings where id = 1;
  if v_settings.id is null then
    raise exception 'Checkout settings are missing';
  end if;

  loop
    v_reference := 'ZV' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.orders where reference = v_reference);
  end loop;

  insert into public.orders (
    id, user_id, status, reference, idempotency_key, contact_email, contact_name, contact_phone,
    subtotal_in_paise, shipping_in_paise, discount_in_paise, tax_in_paise, total_in_paise,
    address_snapshot, access_token_hash
  ) values (
    v_order, p_user, 'pending_payment', v_reference, p_idempotency, lower(p_email), trim(p_name), p_phone,
    0, 0, 0, 0, 0, p_address, p_access_token_hash
  );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 5 then
      raise exception 'Quantity must be between 1 and 5';
    end if;
    select * into v_variant from public.product_variants
    where id = (v_item ->> 'variant_id')::uuid
    for update;
    if v_variant.id is not null and v_variant.id = any(v_seen) then
      raise exception 'A piece was included twice';
    end if;
    if v_variant.id is null or not v_variant.is_active or v_variant.stock_quantity < v_qty or v_variant.price_in_paise <= 0 then
      raise exception 'A selected piece is not available in that quantity';
    end if;
    select name into v_product_name from public.products
    where id = v_variant.product_id and is_active;
    if v_product_name is null then
      raise exception 'A selected piece is not available';
    end if;
    v_seen := array_append(v_seen, v_variant.id);
    perform set_config('zevora.movement_reason', 'sale', true);
    perform set_config('zevora.movement_order_id', v_order::text, true);
    update public.product_variants
    set stock_quantity = stock_quantity - v_qty
    where id = v_variant.id;
    insert into public.order_items (
      order_id, product_id, variant_id, product_name, sku, variant_label, unit_price_in_paise, quantity
    ) values (
      v_order, v_variant.product_id, v_variant.id, v_product_name, v_variant.sku,
      v_variant.size_label || ' / ' || v_variant.color_name,
      v_variant.price_in_paise, v_qty
    );
    v_subtotal := v_subtotal + v_variant.price_in_paise * v_qty;
    v_count := v_count + 1;
  end loop;

  if v_count = 0 or v_subtotal <= 0 then
    raise exception 'The order total is not valid';
  end if;

  if p_coupon is not null and length(trim(p_coupon)) > 0 then
    select * into v_coupon from public.coupons
    where code = upper(trim(p_coupon))
    for update;
    if v_coupon.id is null or not v_coupon.is_active or (v_coupon.expires_at is not null and v_coupon.expires_at <= now()) then
      raise exception 'That coupon is not active';
    end if;
    if v_subtotal < v_coupon.min_subtotal_in_paise then
      raise exception 'This order does not meet the coupon minimum';
    end if;
    if v_coupon.discount_type = 'percent' then
      v_coupon_discount := floor(v_subtotal * v_coupon.amount / 10000);
    else
      v_coupon_discount := least(v_coupon.amount, v_subtotal);
    end if;
  end if;

  v_discounted := v_subtotal - v_coupon_discount;
  v_shipping := case when v_discounted >= v_settings.free_shipping_above_paise then 0 else v_settings.shipping_paise end;
  if v_settings.tax_inclusive then
    v_tax := round(v_discounted * v_settings.tax_rate_bps / (10000.0 + v_settings.tax_rate_bps));
    v_payable := v_discounted + v_shipping;
  else
    v_tax := round(v_discounted * v_settings.tax_rate_bps / 10000.0);
    v_payable := v_discounted + v_shipping + v_tax;
  end if;
  if v_payable <= 0 then
    raise exception 'The payable amount is not valid';
  end if;

  update public.orders
  set subtotal_in_paise = v_subtotal,
      discount_in_paise = v_coupon_discount,
      shipping_in_paise = v_shipping,
      tax_in_paise = v_tax,
      tax_rate_bps = v_settings.tax_rate_bps,
      tax_inclusive = v_settings.tax_inclusive,
      total_in_paise = v_payable,
      coupon_code = case when v_coupon.id is null then null else v_coupon.code end,
      updated_at = now()
  where id = v_order;

  insert into public.payments (order_id, provider, provider_event_id, status, amount_in_paise)
  values (v_order, 'unconfigured', 'order:' || v_order::text, 'pending', v_payable);

  insert into public.order_events (order_id, status, message)
  values (v_order, 'pending_payment', 'Order placed. Payment has not been taken.');

  return jsonb_build_object('reference', v_reference, 'duplicate', false, 'status', 'pending_payment');
exception
  when unique_violation then
    select * into existing from public.orders where idempotency_key = p_idempotency;
    if existing.id is not null and existing.contact_email is not distinct from lower(p_email) then
      return jsonb_build_object('reference', existing.reference, 'duplicate', true, 'status', existing.status);
    end if;
    raise;
end;
$$;

create or replace function public.place_order(p_items jsonb, p_address_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Place the order from checkout. Payment has not been taken.';
end;
$$;

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
  v_item public.order_items%rowtype;
begin
  if p_provider is null or p_provider = '' or p_provider = 'unconfigured' then
    raise exception 'Payment provider is not accepted';
  end if;
  if p_status not in ('authorized', 'captured', 'failed', 'refunded') then
    raise exception 'Payment status is invalid';
  end if;
  select * into v_order from public.orders where id = p_order_id;
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
  elsif p_status = 'failed' and v_order.status = 'pending_payment' then
    update public.orders set status = 'payment_failed', updated_at = now() where id = v_order.id;
    for v_item in select * from public.order_items where order_id = v_order.id and variant_id is not null
    loop
      perform set_config('zevora.movement_reason', 'restock', true);
      perform set_config('zevora.movement_order_id', v_order.id::text, true);
      update public.product_variants
      set stock_quantity = stock_quantity + v_item.quantity
      where id = v_item.variant_id;
    end loop;
    insert into public.order_events (order_id, status, message)
    values (v_order.id, 'payment_failed', 'Payment failed. The order was not confirmed.');
  elsif p_status = 'refunded' and v_order.status = 'returned' then
    update public.orders set status = 'refunded', updated_at = now() where id = v_order.id;
    insert into public.order_events (order_id, status, message)
    values (v_order.id, 'refunded', 'Refund recorded.');
  end if;

  return 'applied';
end;
$$;

create or replace function public.cancel_checkout_order(p_reference text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item public.order_items%rowtype;
begin
  select * into v_order from public.orders where reference = p_reference for update;
  if v_order.id is null then
    raise exception 'Order was not found';
  end if;
  if coalesce(auth.role(), '') is distinct from 'service_role' then
    if v_order.user_id is null or auth.uid() is distinct from v_order.user_id then
      raise exception 'This order could not be opened';
    end if;
  end if;
  if v_order.status not in ('pending_payment', 'confirmed') then
    raise exception 'This order can no longer be cancelled';
  end if;
  for v_item in select * from public.order_items where order_id = v_order.id and variant_id is not null
  loop
    perform set_config('zevora.movement_reason', 'restock', true);
    perform set_config('zevora.movement_order_id', v_order.id::text, true);
    update public.product_variants
    set stock_quantity = stock_quantity + v_item.quantity
    where id = v_item.variant_id;
  end loop;
  update public.orders set status = 'cancelled', updated_at = now() where id = v_order.id;
  insert into public.order_events (order_id, status, message)
  values (v_order.id, 'cancelled', 'Order cancelled before dispatch.');
  return 'cancelled';
end;
$$;

create or replace function public.request_order_return(p_reference text, p_note text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_window integer;
begin
  select * into v_order from public.orders where reference = p_reference for update;
  if v_order.id is null then
    raise exception 'Order was not found';
  end if;
  if coalesce(auth.role(), '') is distinct from 'service_role' then
    if v_order.user_id is null or auth.uid() is distinct from v_order.user_id then
      raise exception 'This order could not be opened';
    end if;
  end if;
  select return_window_days into v_window from public.checkout_settings where id = 1;
  if v_order.status <> 'delivered' or v_order.delivered_at is null
     or v_order.delivered_at < now() - make_interval(days => coalesce(v_window, 7)) then
    raise exception 'This order is outside the return window';
  end if;
  update public.orders set status = 'return_requested', updated_at = now() where id = v_order.id;
  insert into public.order_events (order_id, status, message)
  values (v_order.id, 'return_requested', coalesce(nullif(trim(p_note), ''), 'Return requested.'));
  return 'return_requested';
end;
$$;

create or replace function public.admin_transition_order(p_id uuid, p_status text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item public.order_items%rowtype;
  v_allowed boolean := false;
begin
  if not public.is_admin() then
    raise exception 'This account cannot manage orders';
  end if;
  if p_status not in (
    'pending_payment', 'confirmed', 'processing', 'shipped', 'delivered',
    'payment_failed', 'cancelled', 'return_requested', 'returned', 'refunded'
  ) then
    raise exception 'Choose a valid order status';
  end if;
  select * into v_order from public.orders where id = p_id for update;
  if v_order.id is null then
    raise exception 'Order was not found';
  end if;
  v_allowed := (
    (v_order.status = 'pending_payment' and p_status = 'cancelled') or
    (v_order.status = 'payment_failed' and p_status = 'cancelled') or
    (v_order.status = 'confirmed' and p_status in ('processing', 'cancelled')) or
    (v_order.status = 'processing' and p_status = 'shipped') or
    (v_order.status = 'shipped' and p_status = 'delivered') or
    (v_order.status = 'delivered' and p_status = 'return_requested') or
    (v_order.status = 'return_requested' and p_status in ('returned', 'delivered'))
  );
  if not v_allowed then
    raise exception 'That status change is not allowed';
  end if;
  if v_order.status in ('pending_payment', 'confirmed') and p_status = 'cancelled' then
    for v_item in select * from public.order_items where order_id = v_order.id and variant_id is not null
    loop
      perform set_config('zevora.movement_reason', 'restock', true);
      perform set_config('zevora.movement_order_id', v_order.id::text, true);
      update public.product_variants
      set stock_quantity = stock_quantity + v_item.quantity
      where id = v_item.variant_id;
    end loop;
  end if;
  update public.orders
  set status = p_status,
      delivered_at = case when p_status = 'delivered' then coalesce(delivered_at, now()) else delivered_at end,
      updated_at = now()
  where id = v_order.id;
  insert into public.order_events (order_id, status, message)
  values (v_order.id, p_status, 'Fulfilment updated by the catalogue admin.');
  return p_status;
end;
$$;

drop policy if exists order_events_admin_insert on public.order_events;
create policy order_events_admin_insert on public.order_events
for insert to authenticated
with check (public.is_admin());

revoke all on function public.create_checkout_order(uuid, text, text, text, jsonb, jsonb, text, text, text) from public;
revoke all on function public.apply_payment_event(text, text, uuid, text, integer) from public;
revoke all on function public.cancel_checkout_order(text) from public;
revoke all on function public.request_order_return(text, text) from public;
grant execute on function public.create_checkout_order(uuid, text, text, text, jsonb, jsonb, text, text, text) to service_role;
grant execute on function public.apply_payment_event(text, text, uuid, text, integer) to service_role;
grant execute on function public.cancel_checkout_order(text) to service_role;
grant execute on function public.cancel_checkout_order(text) to authenticated;
grant execute on function public.request_order_return(text, text) to service_role;
grant execute on function public.request_order_return(text, text) to authenticated;
revoke all on function public.admin_transition_order(uuid, text) from public;
grant execute on function public.admin_transition_order(uuid, text) to authenticated;
