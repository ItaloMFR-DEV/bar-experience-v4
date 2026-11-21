-- BAR EXPERIENCE: catálogo de drinks, custos privados e composição dos planos
-- Execute uma única vez no SQL Editor do Supabase.

create table if not exists public.be_drinks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null default 'classico',
  ingredients text[] not null default '{}'::text[],
  method text,
  image_url text,
  alcohol boolean not null default true,
  serving_size_ml integer not null default 400 check (serving_size_ml > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Custos e CMV são isolados da tabela pública de drinks.
create table if not exists public.be_drink_costs (
  drink_id uuid primary key references public.be_drinks(id) on delete cascade,
  ingredient_cost numeric(12,2) not null default 0 check (ingredient_cost >= 0),
  garnish_cost numeric(12,2) not null default 0 check (garnish_cost >= 0),
  packaging_cost numeric(12,2) not null default 0 check (packaging_cost >= 0),
  other_cost numeric(12,2) not null default 0 check (other_cost >= 0),
  reference_price numeric(12,2) not null default 0 check (reference_price >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.be_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  image_url text,
  featured boolean not null default false,
  base_price numeric(12,2) not null default 0 check (base_price >= 0),
  guest_price numeric(12,2) not null default 0 check (guest_price >= 0),
  included_hours integer not null default 4 check (included_hours > 0),
  extra_hour_price numeric(12,2) not null default 0 check (extra_hour_price >= 0),
  drink_option_limit integer not null default 0 check (drink_option_limit >= 0),
  drink_choice_limit integer not null default 0 check (drink_choice_limit >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.be_plan_drinks (
  plan_id uuid not null references public.be_plans(id) on delete cascade,
  drink_id uuid not null references public.be_drinks(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (plan_id, drink_id)
);

create index if not exists be_drinks_active_idx on public.be_drinks(active);
create index if not exists be_plans_active_idx on public.be_plans(active);
create index if not exists be_plan_drinks_drink_idx on public.be_plan_drinks(drink_id);

alter table public.be_drinks enable row level security;
alter table public.be_drink_costs enable row level security;
alter table public.be_plans enable row level security;
alter table public.be_plan_drinks enable row level security;

drop policy if exists "Public can view active drinks" on public.be_drinks;
create policy "Public can view active drinks" on public.be_drinks
  for select to anon, authenticated using (active = true);

drop policy if exists "Admins manage drinks" on public.be_drinks;
create policy "Admins manage drinks" on public.be_drinks
  for all to authenticated using (public.be_is_admin()) with check (public.be_is_admin());

drop policy if exists "Admins manage drink costs" on public.be_drink_costs;
create policy "Admins manage drink costs" on public.be_drink_costs
  for all to authenticated using (public.be_is_admin()) with check (public.be_is_admin());

drop policy if exists "Public can view active plans" on public.be_plans;
create policy "Public can view active plans" on public.be_plans
  for select to anon, authenticated using (active = true);

drop policy if exists "Admins manage plans" on public.be_plans;
create policy "Admins manage plans" on public.be_plans
  for all to authenticated using (public.be_is_admin()) with check (public.be_is_admin());

drop policy if exists "Public can view active plan drinks" on public.be_plan_drinks;
create policy "Public can view active plan drinks" on public.be_plan_drinks
  for select to anon, authenticated using (
    exists (
      select 1 from public.be_plans p
      join public.be_drinks d on d.id = be_plan_drinks.drink_id
      where p.id = be_plan_drinks.plan_id and p.active = true and d.active = true
    )
  );

drop policy if exists "Admins manage plan drinks" on public.be_plan_drinks;
create policy "Admins manage plan drinks" on public.be_plan_drinks
  for all to authenticated using (public.be_is_admin()) with check (public.be_is_admin());

grant select on public.be_drinks to anon, authenticated;
grant insert, update, delete on public.be_drinks to authenticated;
grant select, insert, update, delete on public.be_drink_costs to authenticated;
grant select on public.be_plans to anon, authenticated;
grant insert, update, delete on public.be_plans to authenticated;
grant select on public.be_plan_drinks to anon, authenticated;
grant insert, update, delete on public.be_plan_drinks to authenticated;

-- Configuração inicial dos cinco planos. Os valores comerciais ficam zerados
-- para serem preenchidos pelo administrador antes de publicar a ferramenta.
insert into public.be_plans
  (slug, name, description, included_hours, drink_option_limit, drink_choice_limit, featured)
values
  ('basico', 'Básico', 'Clássicos essenciais para celebrar com leveza e variedade.', 4, 10, 6, false),
  ('intermediario', 'Intermediário', 'Coquetelaria selecionada com diferentes perfis de sabor.', 4, 12, 7, true),
  ('avancado', 'Avançado', 'Uma seleção premium de clássicos da coquetelaria.', 4, 14, 8, false),
  ('personalizado', 'Personalizado', 'Monte uma carta sob medida para o perfil do seu evento.', 4, 0, 8, false),
  ('autoral', 'Autoral', 'Criações exclusivas pensadas para harmonizar com a ocasião.', 4, 7, 7, false)
on conflict (slug) do nothing;

-- Os custos são privados; a política RLS permite acesso apenas ao administrador.
-- O catálogo público de drinks não contém campos de custo ou CMV.
