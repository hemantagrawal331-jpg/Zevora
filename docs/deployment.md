# Deploy ZEVORA

Use separate settings for local development and production. Test Mode Razorpay keys belong on the local app and on a preview deployment. Live keys belong only on the production deployment, and only after the test payment checklist in `docs/razorpay.md` has passed on your own account.

This repository does not contain Supabase or Razorpay credentials. Nothing below has been executed against a production project from this workspace.

## 1. Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Leave the secret values empty until you have a Supabase project and Razorpay test keys. The shop then shows the sample catalogue and does not take payment.

## 2. Check the project

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## 3. Push to GitHub

Commit only when you intend to. Do not commit `.env.local`.

```bash
git push -u origin HEAD
```

## 4. Import into Vercel

1. In Vercel, choose Add New → Project and import the GitHub repository.
2. Framework preset: Next.js. Leave the build command as `next build` and the output as the Next.js default.
3. Create a Production project and, if you want a separate test site, a second Vercel project or use Preview deployments with different environment variables.

## 5. Environment variables

Set these in Vercel → Settings → Environment Variables. Mark every secret as Sensitive. Do not put a secret in a `NEXT_PUBLIC_` name.

| Name | Environments | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Preview and Production | Public project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Preview and Production | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Preview and Production | Server only |
| `NEXT_PUBLIC_SITE_URL` | Production | `https://your-domain` with no path |
| `RAZORPAY_KEY_ID` | Preview: test key. Production: live key only after test checkout passes | Server |
| `RAZORPAY_KEY_SECRET` | Same split as the key id | Server only |
| `RAZORPAY_WEBHOOK_SECRET` | Different value per environment | Server only. Not the key secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Optional | Must match `RAZORPAY_KEY_ID` if set |
| `SUPABASE_IMAGE_TRANSFORMS` | Production | `true` only after transforms are enabled |
| `DATABASE_URL` | Local or a protected CI job | Used by `npm run db:migrate` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` | Production | Sourcing workspace only |

Redeploy after changing variables.

## 6. Supabase

1. Apply `db/migrations/002_commerce.sql`, `003_checkout.sql`, `004_razorpay.sql`, and `005_launch_guards.sql` in that order. `001_sourcing_records.sql` is only for the sourcing workspace.
2. Authentication → URL configuration: set Site URL to the production origin.
3. Add redirect URLs for `https://YOUR_DOMAIN/auth/callback` and `http://localhost:3000/auth/callback`.
4. Promote the first catalogue admin with SQL, as described in `docs/supabase-setup.md`. Do not seed a password.
5. Confirm the `product-images` bucket exists and that storage policies allow public read and admin write.
6. In Authentication → Rate Limits, keep the platform limits for sign-in and email rather than turning them off.

## 7. Razorpay

Follow `docs/razorpay.md`. The production webhook URL is `https://YOUR_DOMAIN/api/payments/webhook`. Use a new webhook secret for production and store it only in `RAZORPAY_WEBHOOK_SECRET`. Subscribe to `payment.captured`, `payment.failed`, `payment.authorized`, and `order.paid`. Keep Test Mode on the test site.

## 8. Test the deployment

On the deployed URL, check the homepage, a department, a product, search, the bag, and an unknown order page. With Supabase configured, create a catalogue product, upload a JPEG, PNG, or WebP under 5 MB, and place a test order. With Razorpay test keys, complete a test payment, a declined payment, and a refresh of the order page. Send one valid webhook and one with a bad signature. The bad signature must leave the order unchanged.

## 9. Custom domain

In Vercel → Domains, add the domain and the DNS records Vercel shows. Set `NEXT_PUBLIC_SITE_URL` to that `https` origin and redeploy. Update the Supabase Site URL, redirect URLs, and the Razorpay webhook URL to the same origin.

## 10. Confirm before launch

HTTPS is provided by Vercel after the domain is attached. Confirm checkout creates an order, the payment is verified on the server, and product images load from Supabase. Do not treat a preview deployment or this repository as proof that live payments work.
