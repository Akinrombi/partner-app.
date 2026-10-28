-- QuickEats rider onboarding security hardening.
-- Review and apply through the Supabase migration workflow after staging validation.
begin;

alter table public.riders
  add column if not exists date_of_birth date,
  add column if not exists home_address text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists safety_rules_accepted_at timestamptz,
  add column if not exists delivery_rules_accepted_at timestamptz,
  add column if not exists payout_verified boolean not null default false,
  add column if not exists payout_verified_at timestamptz,
  add column if not exists onboarding_status text not null default 'pending_profile';

alter table public.rider_documents
  add column if not exists expires_at date,
  add column if not exists document_metadata jsonb not null default '{}'::jsonb;

create table if not exists public.rider_audit_log (
  id bigint generated always as identity primary key,
  rider_id uuid not null references public.riders(id) on delete cascade,
  actor_user_id uuid,
  action text not null check (action in ('submitted','approved','rejected','resubmission_requested','suspended','reactivated','payout_verified','payout_unverified','document_reviewed')),
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.rider_audit_log enable row level security;
revoke all on public.rider_audit_log from anon, authenticated;
grant select on public.rider_audit_log to authenticated;
drop policy if exists "Admins can read rider audit log" on public.rider_audit_log;
create policy "Admins can read rider audit log" on public.rider_audit_log
  for select to authenticated using (public.is_admin());

-- Rider profile updates must never change approval, online status, or other admin-controlled fields.
create or replace function public.guard_rider_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.user_id is distinct from old.user_id
      or new.rejection_reason is distinct from old.rejection_reason
      or new.reviewed_at is distinct from old.reviewed_at
      or new.payout_verified is distinct from old.payout_verified
      or new.payout_verified_at is distinct from old.payout_verified_at then
      raise exception 'Rider identity, review outcome, and payout verification are admin-controlled.';
    end if;
    -- A rider may only move their own application back to a non-approved pending state.
    if new.approval_status is distinct from old.approval_status
      and new.approval_status not in ('pending','pending_profile','pending_documents','under_review','needs_resubmission') then
      raise exception 'Only an administrator can approve, activate, reject, or suspend a rider.';
    end if;
    if new.documents_submitted_at is distinct from old.documents_submitted_at
      and (new.approval_status not in ('pending','pending_documents','under_review','needs_resubmission')
           or new.documents_submitted_at is null) then
      raise exception 'Document submission timestamps are only allowed for pending applications.';
    end if;
    if new.is_online is distinct from old.is_online
      and not (old.approval_status in ('active','approved') and old.payout_verified = true) then
      raise exception 'Rider must be active and payout-verified before going online.';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists guard_rider_sensitive_fields on public.riders;
create trigger guard_rider_sensitive_fields
before update on public.riders
for each row execute function public.guard_rider_sensitive_fields();

-- Remove broad policies and replace with owner-scoped policies.
drop policy if exists "Riders read available or assigned orders" on public.orders;
create policy "Active riders read available or assigned orders" on public.orders
for select to authenticated
using (
  exists (
    select 1 from public.riders r
    where r.user_id = (select auth.uid())
      and r.approval_status in ('active','approved')
      and r.payout_verified = true
      and (
        (orders.rider_id is null and orders.status::text in ('vendor_accepted','ready_for_rider','ready_for_pickup'))
        or orders.rider_id = r.id
      )
  )
);

drop policy if exists "Rider read own wallet" on public.wallets;
create policy "Active rider read own wallet" on public.wallets
for select to authenticated
using (
  exists (select 1 from public.riders r
    where r.id = wallets.rider_id and r.user_id = (select auth.uid())
      and r.approval_status in ('active','approved') and r.payout_verified = true)
);

drop policy if exists "Rider read own transactions" on public.transactions;
drop policy if exists "Rider read own transactions" on public.transactions;
create policy "Active rider read own transactions" on public.transactions
for select to authenticated
using (
  exists (select 1 from public.wallets w join public.riders r on r.id = w.rider_id
    where w.id = transactions.wallet_id and r.user_id = (select auth.uid())
      and r.approval_status in ('active','approved') and r.payout_verified = true)
);

-- Documents remain private; only their owner and authorized admins can read them.
drop policy if exists "Riders can view own documents" on public.rider_documents;
create policy "Riders and admins can view rider documents" on public.rider_documents
for select to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

insert into public.rider_audit_log (rider_id, actor_user_id, action, reason, metadata)
select r.id, null, 'submitted', 'Backfilled existing submission status for audit baseline',
       jsonb_build_object('source','migration_baseline')
from public.riders r
where r.documents_submitted_at is not null
  and not exists (select 1 from public.rider_audit_log l where l.rider_id=r.id and l.action='submitted');

commit;
