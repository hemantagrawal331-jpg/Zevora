# Supabase setup

This project does not ship with a Supabase project, URL, or keys. Nothing here has been connected to a live database until you add your own credentials and apply the migration.

## 1. Create the project

1. Create a project at [supabase.com](https://supabase.com).
2. In Project Settings → API, copy the project URL and the `anon` public key.
3. Copy the `service_role` key only into a server environment. Never put it in `NEXT_PUBLIC_` variables, client components, or a git commit.
4. In Project Settings → Database, copy the connection string if you want `npm run db:migrate` to apply SQL. You can instead paste `db/migrations/002_commerce.sql` into the Supabase SQL editor.

## 2. Environment

Copy `.env.example` to `.env.local`. Fill in your values. Do not replace an existing `.env.local` blindly. The sourcing workspace still uses `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, and `ADMIN_SESSION_SECRET`. Those are separate from Supabase Auth.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PAYMENT_WEBHOOK_SECRET=
SUPABASE_IMAGE_TRANSFORMS=false
```

`PAYMENT_WEBHOOK_SECRET` stays empty until a payment provider is chosen. The webhook at `/api/payments/webhook` returns 503 and does not change payment status when it is empty.

Set `SUPABASE_IMAGE_TRANSFORMS=true` only after Image Transformations are enabled for the project. Otherwise the shop uses the original public object URL.

Restart `npm run dev` after changing environment variables.

## 3. Apply the schema

The commerce migrations are `db/migrations/002_commerce.sql` and `db/migrations/003_checkout.sql`. The first creates profiles, categories, products, variants, images, wishlists, carts, orders, order items, payments, addresses, and inventory movements. The checkout migration adds order references, coupons, fulfilment events, guest checkout, and server-side totals. It enables row level security, seeds the three departments and their subcategories, and creates the public `product-images` bucket.

If `DATABASE_URL` points at this Supabase database and the `auth` schema exists:

```bash
npm run db:migrate
```

If `DATABASE_URL` is a different database, the command skips `002_commerce.sql` and `003_checkout.sql` and tells you to run them in the Supabase SQL editor. Run 002 before 003. The sourcing migration is unchanged.

The migration does not create an administrator and does not insert products.

## 4. Auth

In Authentication → Providers, keep email enabled. Add `http://localhost:3000/auth/callback` to the redirect allow list, plus your production URL.

Register at `/account/register`. Confirmation emails are sent by Supabase only when that setting is on.

## 5. First administrator

Sign up, then in the SQL editor run:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

A customer cannot change `profiles.role`. The SQL editor can, because it is not a signed-in customer. After that, sign in and open `/admin/products`.

The sourcing workspace at `/admin/sourcing` keeps its separate staff cookie. It is not the catalogue admin.

## 6. Photographs

Upload JPEG, PNG, or WebP files up to 5 MB from the product editor. Files are stored at `products/{productId}/{uuid}.ext` in the `product-images` bucket. Only an administrator session can upload or delete. Visitors can read the public objects.

## 7. What stays on sample data

If the public Supabase URL or anon key is missing, the shop keeps the sample catalogue and says so on the page. Sample products are not written into Supabase. When credentials are present, the shop reads active products from the database and does not mix in the sample list.

## 8. Checkout and payments

Checkout creates an order with status `pending_payment` and reserves stock inside the database. Prices, discounts, shipping, and tax are calculated there. The browser total is ignored. A human-readable reference looks like `ZV` plus eight characters. Guest checkout is allowed; the confirmation page is opened with an httpOnly cookie, not by guessing the reference. Signed-in customers can also open their own orders from account history.

The default rules, stored in `checkout_settings`, are complimentary shipping from ₹5,000, otherwise ₹150, and GST at 5% included in the listed price. A coupon amount for `percent` is in basis points, so 1000 means 10%.

Razorpay is shown only when both `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set. This step does not create a Razorpay charge and has no control that marks an order paid. Opening `/order/ZV........` does not change payment status.

A provider may later `POST /api/payments/webhook` with `x-zevora-signature` set to the hex HMAC-SHA256 of the raw body using `PAYMENT_WEBHOOK_SECRET`. The body is JSON:

```json
{
  "provider": "razorpay",
  "eventId": "evt_unique",
  "orderId": "order-uuid",
  "status": "captured",
  "amountInPaise": 199900
}
```

`provider` cannot be `unconfigured`. The captured amount must match the order total. Capture moves only `pending_payment` to `confirmed`. `failed` moves that same state to `payment_failed` and returns the reserved stock. The same provider and event id is stored once. Repeating it returns `duplicate` and does not apply the event again. `PAYMENT_WEBHOOK_SECRET` stays empty until you choose a provider. The webhook then returns 503 and does not change payment status.
