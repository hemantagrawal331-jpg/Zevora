# ZEVORA

Storefront for ZEVORA, a clothing and accessories house. Built with Next.js, TypeScript, and Tailwind CSS.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Replace the photography

Demo images live in `public/images`. Paths are listed in `lib/images.ts`. Product names and prices live in `lib/products.ts`. Announcement text, contact details, and social links live in `lib/site.ts`.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Bag and wishlist pieces saved in the browser stay on this device. When Supabase is configured, signed-in customers also have an account wishlist, addresses, and orders. See [docs/supabase-setup.md](docs/supabase-setup.md). Razorpay checkout is described in [docs/razorpay.md](docs/razorpay.md). Deployment steps are in [docs/deployment.md](docs/deployment.md).
