-- BAR EXPERIENCE: categorias de catálogo e organização comercial
-- Seguro para execução após as migrações anteriores; preserva os registros existentes.
alter table public.be_plans add column if not exists category text not null default 'social';
alter table public.be_services add column if not exists category text not null default 'bar';
alter table public.be_structures add column if not exists category text not null default 'bar';
alter table public.be_professionals add column if not exists category text not null default 'equipe';
alter table public.be_promotions add column if not exists category text not null default 'geral';

create index if not exists be_plans_category_idx on public.be_plans(category);
create index if not exists be_services_category_idx on public.be_services(category);
create index if not exists be_structures_category_idx on public.be_structures(category);
create index if not exists be_professionals_category_idx on public.be_professionals(category);
create index if not exists be_promotions_category_idx on public.be_promotions(category);
create index if not exists be_drinks_category_idx on public.be_drinks(category);

comment on column public.be_plans.category is 'Categoria comercial do plano para filtros e relatórios';
comment on column public.be_services.category is 'Categoria comercial do serviço';
comment on column public.be_structures.category is 'Categoria da estrutura ou equipamento';
comment on column public.be_professionals.category is 'Categoria de atuação do profissional';
comment on column public.be_promotions.category is 'Categoria da campanha promocional';
