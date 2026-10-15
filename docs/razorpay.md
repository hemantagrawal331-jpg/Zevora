# Razorpay test checkout

ZEVORA uses Razorpay Standard Checkout. The server creates the Razorpay order. The browser opens `https://checkout.razorpay.com/v1/checkout.js`. The server verifies the checkout signature with `RAZORPAY_KEY_SECRET`, then checks the payment with the Razorpay API. The webhook uses a different secret, `RAZORPAY_WEBHOOK_SECRET`.

This repository does not include Razorpay credentials. No test or live payment has been executed from this workspace. Stay in Test Mode until the checks below pass on your own account. Do not switch the dashboard to live mode as part of setup.

## 1. Test mode keys

1. Sign in to the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Turn on Test Mode.
3. Open Account & Settings → API Keys → Generate Key in Test Mode.
4. Put the key id in `RAZORPAY_KEY_ID`. It starts with `rzp_test_`.
5. Put the key secret in `RAZORPAY_KEY_SECRET`. Leave this server-only.
6. If you also set `NEXT_PUBLIC_RAZORPAY_KEY_ID`, it must be the same key id. The checkout payload already returns the public key id, so the public variable can stay empty.

## 2. Automatic capture

1. Open Account & Settings → Payment Capture.
2. Choose Automatic Capture.
3. Orders created by ZEVORA also send `payment_capture: true`. An authorised-only payment does not confirm the order.

## 3. Webhook

Localhost is not a public webhook URL. Use the deployed HTTPS site, or a tunnel that forwards to the local app, and subscribe the public URL.

1. Open Account & Settings → Webhooks → Add New Webhook.
2. Set the URL to `https://YOUR_DOMAIN/api/payments/webhook`.
3. Set a webhook secret of at least 32 characters. Put that exact value in `RAZORPAY_WEBHOOK_SECRET`. Do not reuse the key secret.
4. Subscribe to `payment.captured`, `payment.failed`, `payment.authorized`, and `order.paid`.
5. Save. Razorpay sends `x-razorpay-signature`, an HMAC-SHA256 of the raw body using the webhook secret.
6. Restart the app after changing `.env.local`.

An invalid signature returns 400 and does not change the order. A missing webhook secret returns 503 and does not change the order. The same payment status and payment id are stored once. A later `payment.captured` can still confirm an order after `payment.authorized` or `payment.failed`, because those use different event ids. A declined payment leaves the order awaiting payment so the customer can retry the same Razorpay order. A captured payment confirms the order only while it is `pending_payment` and the amount and currency match. A captured payment that arrives after the order is already settled, cancelled, or `payment_failed` is refunded.

## 4. Database

Apply `db/migrations/004_razorpay.sql` after `002_commerce.sql` and `003_checkout.sql`. It stores `orders.razorpay_order_id` and replaces `apply_payment_event`.

## 5. What to try

Use the test payment methods in Razorpay’s Test Mode documentation. The official list changes, so use the current dashboard help rather than a copied card number from this file.

- Success: checkout shows Paid only after the server records a captured payment for the saved amount.
- Failure: a declined test payment leaves the order unpaid and still reserved. Pay with Razorpay on the order page reuses the same Razorpay order.
- Close the checkout window: the order stays unpaid. Refreshing the order page does not mark it paid.
- Invalid webhook signature: the order does not change.
- Repeat the same webhook: the second delivery does not confirm the order twice.
- After a successful payment, close the browser before the redirect finishes, then open the order page again. The page checks Razorpay and shows the verified status.
- Cancelling an order that has a captured payment asks Razorpay to refund that payment before the order is cancelled.

Live keys are accepted by the same code path and were not verified here. Keep Test Mode until the list above passes with your own test keys.
