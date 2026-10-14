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
npm run build
```

Bag, wishlist, newsletter, and the contact form are stored in the browser only. Payments, accounts, and email are not connected.
