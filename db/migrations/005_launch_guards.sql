-- Launch guards.
-- An admin session cannot mark an order paid or refunded by editing the orders table.
-- Checkout signatures stay on the server.

create or replace function public.protect_order_payment_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if old.status = 'pending_payment' and new.status in ('confirmed', 'payment_failed')
       and coalesce(auth.role(), '') is distinct from 'service_role' then
      raise exception 'Only a verified payment event can confirm this order';
    end if;
    if old.status = 'returned' and new.status = 'refunded'
       and coalesce(auth.role(), '') is distinct from 'service_role' then
      raise exception 'Only a verified payment event can refund this order';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_protect_payment_status on public.orders;
create trigger orders_protect_payment_status
before update on public.orders
for each row execute function public.protect_order_payment_status();

revoke select (checkout_signature) on table public.payments from anon, authenticated;
