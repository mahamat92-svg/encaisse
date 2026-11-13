-- Migration 0005 : Paiements Mobile Money Cameroun en attente de validation

create table if not exists public.payment_submissions (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizations(id) on delete cascade,
  document_id      uuid not null references public.documents(id) on delete cascade,
  document_number  text not null,
  client_name      text not null,
  amount           bigint not null,
  payer_phone      text not null,
  transaction_code text not null,
  operator         text not null check (operator in ('orange_money', 'mtn_momo')),
  status           text not null default 'pending' check (status in ('pending', 'validated', 'rejected')),
  created_at       timestamptz not null default now(),
  reviewed_at      timestamptz
);

create index if not exists idx_payment_submissions_org_status
  on public.payment_submissions(org_id, status, created_at desc);

create index if not exists idx_payment_submissions_doc_status
  on public.payment_submissions(document_id, status, created_at desc);

alter table public.payment_submissions enable row level security;

drop policy if exists "payment_submissions_select_org" on public.payment_submissions;
create policy "payment_submissions_select_org"
  on public.payment_submissions for select
  to authenticated
  using (public.has_org_role(org_id) or public.is_platform_admin());

drop policy if exists "payment_submissions_update_org" on public.payment_submissions;
create policy "payment_submissions_update_org"
  on public.payment_submissions for update
  to authenticated
  using (public.can_write(org_id) or public.is_platform_admin())
  with check (public.can_write(org_id) or public.is_platform_admin());

-- RPC publique pour soumettre une preuve de paiement Mobile Money depuis /pay/[invoice_id]
create or replace function public.submit_mobile_money_payment(
  p_token text,
  p_payer_phone text,
  p_transaction_code text,
  p_operator text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doc record;
  v_balance bigint;
  v_phone text := trim(coalesce(p_payer_phone, ''));
  v_code text := trim(coalesce(p_transaction_code, ''));
  v_sub public.payment_submissions;
begin
  if p_operator not in ('orange_money', 'mtn_momo') then
    raise exception using errcode = 'P0001', message = 'INVALID_OPERATOR';
  end if;

  if char_length(v_phone) < 6 then
    raise exception using errcode = 'P0001', message = 'INVALID_PHONE';
  end if;

  if char_length(v_code) < 3 then
    raise exception using errcode = 'P0001', message = 'INVALID_TRANSACTION_CODE';
  end if;

  select
    d.id,
    d.org_id,
    d.number,
    d.doc_type,
    d.status,
    d.total,
    d.paid_total,
    d.credited_total,
    c.name as client_name
  into v_doc
  from public.documents d
  join public.clients c on c.id = d.client_id
  join public.organizations o on o.id = d.org_id
  where (d.public_token = p_token or d.id::text = p_token)
    and d.status <> 'draft'
    and o.suspended_at is null
  limit 1;

  if not found or v_doc.doc_type <> 'invoice' then
    raise exception using errcode = 'P0001', message = 'INVOICE_NOT_FOUND';
  end if;

  v_balance := greatest(0, v_doc.total - v_doc.paid_total - v_doc.credited_total);
  if v_doc.status in ('paid', 'cancelled') or v_balance <= 0 then
    raise exception using errcode = 'P0001', message = 'INVOICE_ALREADY_PAID';
  end if;

  if exists (
    select 1 from public.payment_submissions
    where document_id = v_doc.id and status = 'pending'
  ) then
    raise exception using errcode = 'P0001', message = 'ALREADY_PENDING';
  end if;

  insert into public.payment_submissions (
    org_id,
    document_id,
    document_number,
    client_name,
    amount,
    payer_phone,
    transaction_code,
    operator,
    status
  ) values (
    v_doc.org_id,
    v_doc.id,
    coalesce(v_doc.number, 'FACTURE'),
    v_doc.client_name,
    v_balance,
    v_phone,
    v_code,
    p_operator,
    'pending'
  )
  returning * into v_sub;

  return jsonb_build_object(
    'id', v_sub.id,
    'document_id', v_sub.document_id,
    'document_number', v_sub.document_number,
    'client_name', v_sub.client_name,
    'amount', v_sub.amount,
    'payer_phone', v_sub.payer_phone,
    'transaction_code', v_sub.transaction_code,
    'operator', v_sub.operator,
    'status', v_sub.status,
    'created_at', v_sub.created_at
  );
end $$;

grant execute on function public.submit_mobile_money_payment(text, text, text, text) to anon, authenticated;

-- Mise à jour de get_public_document(p_token) pour inclure pending_submission
create or replace function public.get_public_document(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', d.id,
    'public_token', d.public_token,
    'number', d.number,
    'type', d.doc_type,
    'status', d.status,
    'locale', d.locale,
    'issue_date', d.issue_date,
    'due_date', d.due_date,
    'subtotal', d.subtotal,
    'vat_total', d.vat_total,
    'total', d.total,
    'balance', d.total - d.paid_total - d.credited_total,
    'client_name', c.name,
    'client_phone', coalesce(c.phone, c.payer_phone, ''),
    'pending_submission', (
      select jsonb_build_object(
        'id', ps.id,
        'operator', ps.operator,
        'payer_phone', ps.payer_phone,
        'transaction_code', ps.transaction_code,
        'amount', ps.amount,
        'status', ps.status,
        'created_at', ps.created_at
      )
      from public.payment_submissions ps
      where ps.document_id = d.id
        and ps.status = 'pending'
      order by ps.created_at desc
      limit 1
    ),
    'org', jsonb_build_object(
      'name', coalesce(nullif(ms.company_name, ''), o.name),
      'logo_url', coalesce(nullif(ms.logo_url, ''), o.logo_url),
      'city', coalesce(nullif(ms.address_city, ''), o.city),
      'phone', coalesce(nullif(ms.whatsapp_phone, ''), o.phone),
      'email', coalesce(ms.email, ''),
      'rccm_niu', coalesce(nullif(ms.rccm_niu, ''), o.rccm, o.niu, ''),
      'slogan', coalesce(ms.slogan, ''),
      'primary_color', coalesce(ms.primary_color, 'green'),
      'niu', o.niu,
      'rccm', o.rccm,
      'footer_note', o.footer_note,
      'mtn_momo_number', o.mtn_momo_number,
      'orange_money_number', o.orange_money_number
    ),
    'lines', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'label', l.label,
          'quantity', l.quantity,
          'unit_price', l.unit_price,
          'total', l.line_total
        ) order by l.position
      )
      from public.document_lines l
      where l.document_id = d.id
    ), '[]'::jsonb)
  )
  from public.documents d
  join public.clients c on c.id = d.client_id
  join public.organizations o on o.id = d.org_id
  left join lateral (
    select * from public.merchant_settings m
    where m.org_id = o.id
    order by m.updated_at desc
    limit 1
  ) ms on true
  where (d.public_token = p_token or d.id::text = p_token)
    and d.status <> 'draft'
    and o.suspended_at is null
  limit 1;
$$;

grant execute on function public.get_public_document(text) to anon, authenticated;

