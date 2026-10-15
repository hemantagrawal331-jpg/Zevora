-- Commerce schema for the Supabase project.
-- Apply this in the Supabase SQL editor, or with npm run db:migrate when
-- DATABASE_URL points at that same Supabase database.
-- It does not create an administrator and it does not insert products.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 80),
  department text not null check (department in ('men', 'women', 'accessories')),
  description text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists categories_root_slug_idx
  on public.categories (slug) where parent_id is null;

create unique index if not exists categories_child_slug_idx
  on public.categories (parent_id, slug) where parent_id is not null;

create index if not exists categories_department_idx on public.categories (department, is_active);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 140),
  description text not null default '',
  material text not null default '',
  fit text not null default '',
  care text not null default '',
  tags text[] not null default '{}',
  is_new_arrival boolean not null default false,
  is_bestseller boolean not null default false,
  is_active boolean not null default false,
  popularity integer not null default 0 check (popularity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id, is_active);
create index if not exists products_created_idx on public.products (created_at desc);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique check (sku ~ '^[A-Z0-9-]{3,40}$'),
  size_label text not null check (char_length(size_label) between 1 and 20),
  color_name text not null check (char_length(color_name) between 1 and 40),
  color_hex text not null default '#171717' check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  price_in_paise integer not null check (price_in_paise > 0),
  compare_at_price_in_paise integer check (
    compare_at_price_in_paise is null or compare_at_price_in_paise > price_in_paise
  ),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size_label, color_name)
);

create index if not exists product_variants_product_idx on public.product_variants (product_id);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  alt text not null default '',
  color_name text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, storage_path)
);

create index if not exists product_images_order_idx on public.product_images (product_id, sort_order);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 80),
  phone text not null check (phone ~ '^[0-9+ -]{8,20}$'),
  line1 text not null check (char_length(line1) between 1 and 120),
  line2 text not null default '',
  city text not null check (char_length(city) between 1 and 80),
  state text not null check (char_length(state) between 1 and 80),
  postal_code text not null check (postal_code ~ '^[1-9][0-9]{5}$'),
  country text not null default 'India',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists addresses_user_idx on public.addresses (user_id);

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (wishlist_id, product_id)
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  quantity integer not null check (quantity between 1 and 5),
  unique (cart_id, variant_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded')
  ),
  subtotal_in_paise integer not null check (subtotal_in_paise >= 0),
  shipping_in_paise integer not null check (shipping_in_paise >= 0),
  total_in_paise integer not null check (total_in_paise >= 0),
  address_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  sku text not null,
  variant_label text not null,
  unit_price_in_paise integer not null check (unit_price_in_paise > 0),
  quantity integer not null check (quantity between 1 and 5)
);

create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null,
  provider_event_id text not null,
  status text not null check (status in ('pending', 'authorized', 'captured', 'failed', 'refunded')),
  amount_in_paise integer not null check (amount_in_paise > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create index if not exists payments_order_idx on public.payments (order_id);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  delta integer not null,
  reason text not null check (reason in ('adjustment', 'sale', 'restock', 'return')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists inventory_movements_variant_idx on public.inventory_movements (variant_id, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'Profile role cannot be changed from the client';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
before update on public.profiles
for each row execute function public.protect_profile_role();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.products_require_subcategory()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.categories
    where id = new.category_id and parent_id is not null
  ) then
    raise exception 'Choose a subcategory';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_subcategory on public.products;
create trigger products_subcategory
before insert or update on public.products
for each row execute function public.products_require_subcategory();

create or replace function public.log_variant_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  movement_reason text := coalesce(nullif(current_setting('zevora.movement_reason', true), ''), 'adjustment');
  order_text text := nullif(current_setting('zevora.movement_order_id', true), '');
begin
  if movement_reason not in ('adjustment', 'sale', 'restock', 'return') then
    movement_reason := 'adjustment';
  end if;
  if tg_op = 'INSERT' then
    insert into public.inventory_movements (variant_id, delta, reason, created_by)
    values (new.id, new.stock_quantity, 'adjustment', auth.uid());
  elsif new.stock_quantity is distinct from old.stock_quantity then
    insert into public.inventory_movements (variant_id, delta, reason, order_id, created_by)
    values (
      new.id,
      new.stock_quantity - old.stock_quantity,
      movement_reason,
      case when order_text is null then null else order_text::uuid end,
      auth.uid()
    );
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists product_variants_stock on public.product_variants;
create trigger product_variants_stock
before insert or update on public.product_variants
for each row execute function public.log_variant_stock();

create or replace function public.place_order(p_items jsonb, p_address_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_order uuid := gen_random_uuid();
  v_item jsonb;
  v_variant public.product_variants%rowtype;
  v_qty integer;
  v_subtotal integer := 0;
  v_shipping integer;
  v_address public.addresses%rowtype;
  v_count integer := 0;
begin
  if v_user is null then
    raise exception 'Sign in required';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 20 then
    raise exception 'Choose between 1 and 20 pieces';
  end if;
  select * into v_address from public.addresses where id = p_address_id and user_id = v_user;
  if v_address.id is null then
    raise exception 'Choose a saved address';
  end if;

  insert into public.orders (
    id, user_id, status, subtotal_in_paise, shipping_in_paise, total_in_paise, address_snapshot
  ) values (
    v_order, v_user, 'pending', 0, 0, 0,
    jsonb_build_object(
      'fullName', v_address.full_name,
      'phone', v_address.phone,
      'line1', v_address.line1,
      'line2', v_address.line2,
      'city', v_address.city,
      'state', v_address.state,
      'postalCode', v_address.postal_code,
      'country', v_address.country
    )
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
    if v_variant.id is null or not v_variant.is_active or v_variant.stock_quantity < v_qty then
      raise exception 'A selected piece is not available in that quantity';
    end if;
    if not exists (
      select 1 from public.products where id = v_variant.product_id and is_active
    ) then
      raise exception 'A selected piece is not available';
    end if;

    perform set_config('zevora.movement_reason', 'sale', true);
    perform set_config('zevora.movement_order_id', v_order::text, true);
    update public.product_variants
    set stock_quantity = stock_quantity - v_qty
    where id = v_variant.id;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name, sku, variant_label, unit_price_in_paise, quantity
    )
    select v_order, products.id, v_variant.id, products.name, v_variant.sku,
      v_variant.size_label || ' / ' || v_variant.color_name,
      v_variant.price_in_paise, v_qty
    from public.products
    where products.id = v_variant.product_id;

    v_subtotal := v_subtotal + v_variant.price_in_paise * v_qty;
    v_count := v_count + 1;
  end loop;

  if v_count = 0 then
    raise exception 'Choose a piece';
  end if;

  v_shipping := case when v_subtotal >= 500000 then 0 else 15000 end;
  update public.orders
  set subtotal_in_paise = v_subtotal,
      shipping_in_paise = v_shipping,
      total_in_paise = v_subtotal + v_shipping,
      updated_at = now()
  where id = v_order;

  insert into public.payments (order_id, provider, provider_event_id, status, amount_in_paise)
  values (v_order, 'unconfigured', 'order:' || v_order::text, 'pending', v_subtotal + v_shipping);

  return v_order;
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
begin
  if p_provider is null or p_provider = '' or p_provider = 'unconfigured' then
    raise exception 'Payment provider is not accepted';
  end if;
  if p_status not in ('authorized', 'captured', 'failed', 'refunded') then
    raise exception 'Payment status is invalid';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount is invalid';
  end if;
  if not exists (select 1 from public.orders where id = p_order_id) then
    raise exception 'Order was not found';
  end if;

  insert into public.payments (order_id, provider, provider_event_id, status, amount_in_paise)
  values (p_order_id, p_provider, p_event_id, p_status, p_amount)
  on conflict (provider, provider_event_id) do nothing
  returning id into inserted_id;

  if inserted_id is null then
    return 'duplicate';
  end if;

  if p_status = 'captured' then
    update public.orders
    set status = 'confirmed', updated_at = now()
    where id = p_order_id and status = 'pending';
  elsif p_status = 'refunded' then
    update public.orders
    set status = 'refunded', updated_at = now()
    where id = p_order_id and status <> 'cancelled';
  end if;

  return 'applied';
end;
$$;

revoke all on function public.place_order(jsonb, uuid) from public;
revoke all on function public.apply_payment_event(text, text, uuid, text, integer) from public;
grant execute on function public.place_order(jsonb, uuid) to authenticated;
grant execute on function public.apply_payment_event(text, text, uuid, text, integer) to service_role;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.inventory_movements enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
for select to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
for select to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists variants_public_read on public.product_variants;
create policy variants_public_read on public.product_variants
for select to anon, authenticated
using (
  public.is_admin() or (
    is_active = true and exists (
      select 1 from public.products
      where products.id = product_id and products.is_active = true
    )
  )
);

drop policy if exists variants_admin_write on public.product_variants;
create policy variants_admin_write on public.product_variants
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists images_public_read on public.product_images;
create policy images_public_read on public.product_images
for select to anon, authenticated
using (
  public.is_admin() or exists (
    select 1 from public.products
    where products.id = product_id and products.is_active = true
  )
);

drop policy if exists images_admin_write on public.product_images;
create policy images_admin_write on public.product_images
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists addresses_own on public.addresses;
create policy addresses_own on public.addresses
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists wishlists_own on public.wishlists;
create policy wishlists_own on public.wishlists
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists wishlist_items_own on public.wishlist_items;
create policy wishlist_items_own on public.wishlist_items
for all to authenticated
using (
  exists (select 1 from public.wishlists where wishlists.id = wishlist_id and wishlists.user_id = auth.uid())
)
with check (
  exists (select 1 from public.wishlists where wishlists.id = wishlist_id and wishlists.user_id = auth.uid())
);

drop policy if exists carts_own on public.carts;
create policy carts_own on public.carts
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists cart_items_own on public.cart_items;
create policy cart_items_own on public.cart_items
for all to authenticated
using (
  exists (select 1 from public.carts where carts.id = cart_id and carts.user_id = auth.uid())
)
with check (
  exists (select 1 from public.carts where carts.id = cart_id and carts.user_id = auth.uid())
);

drop policy if exists orders_select_own on public.orders;
create policy orders_select_own on public.orders
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists order_items_select_own on public.order_items;
create policy order_items_select_own on public.order_items
for select to authenticated
using (
  exists (
    select 1 from public.orders
    where orders.id = order_id and (orders.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments
for select to authenticated
using (
  exists (
    select 1 from public.orders
    where orders.id = order_id and (orders.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists inventory_admin_read on public.inventory_movements;
create policy inventory_admin_read on public.inventory_movements
for select to authenticated
using (public.is_admin());

insert into public.categories (slug, name, department, description, sort_order)
select v.slug, v.name, v.department, v.description, v.sort_order
from (
  values
    ('men', 'Men', 'men', 'Denim, sweats, shirts, and jackets for men.', 1),
    ('women', 'Women', 'women', 'Tops, denim, dresses, and sets for women.', 2),
    ('accessories', 'Accessories', 'accessories', 'Wallets, belts, scent, caps, eyewear, bags, and jewellery.', 3)
) as v(slug, name, department, description, sort_order)
where not exists (
  select 1 from public.categories c where c.parent_id is null and c.slug = v.slug
);

insert into public.categories (slug, name, department, parent_id, sort_order)
select v.slug, v.name, v.department, parent.id, v.sort_order
from (
  values
    ('men', 'denim-jeans', 'Denim jeans', 1),
    ('men', 'hoodies', 'Hoodies', 2),
    ('men', 'sweatshirts', 'Sweatshirts', 3),
    ('men', 'joggers', 'Joggers and lowers', 4),
    ('men', 'gymwear', 'Gymwear and activewear', 5),
    ('men', 't-shirts', 'T-shirts', 6),
    ('men', 'shirts', 'Shirts', 7),
    ('men', 'jackets', 'Jackets', 8),
    ('men', 'cargo-pants', 'Cargo pants', 9),
    ('men', 'shorts', 'Shorts', 10),
    ('women', 'crop-tops', 'Crop tops', 1),
    ('women', 'tops', 'Tops and T-shirts', 2),
    ('women', 'hoodies', 'Hoodies', 3),
    ('women', 'jeans', 'Jeans', 4),
    ('women', 'denim', 'Denim', 5),
    ('women', 'skirts', 'Skirts', 6),
    ('women', 'shorts', 'Shorts', 7),
    ('women', 'dresses', 'Dresses', 8),
    ('women', 'jackets', 'Jackets', 9),
    ('women', 'co-ord-sets', 'Co-ord sets', 10),
    ('accessories', 'wallets', 'Wallets', 1),
    ('accessories', 'belts', 'Belts', 2),
    ('accessories', 'perfumes', 'Perfumes', 3),
    ('accessories', 'caps', 'Caps', 4),
    ('accessories', 'sunglasses', 'Sunglasses', 5),
    ('accessories', 'bags', 'Bags', 6),
    ('accessories', 'fashion-jewellery', 'Fashion jewellery', 7),
    ('accessories', 'essentials', 'Other fashion essentials', 8)
) as v(department, slug, name, sort_order)
join public.categories parent on parent.parent_id is null and parent.slug = v.department
where not exists (
  select 1 from public.categories c where c.parent_id = parent.id and c.slug = v.slug
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects
for select to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects
for update to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete on storage.objects
for delete to authenticated
using (bucket_id = 'product-images' and public.is_admin());
