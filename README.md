# BAR EXPERIENCE

Aplicação React + Vite + Supabase para portfólio, catálogo, composição de cardápios e orçamento de eventos.

## Executar no Android com Termux

```bash
cd ~/bar_experience_v4
npm install
npm run dev -- --host 0.0.0.0
```

Abra `http://127.0.0.1:5173` no navegador do celular.

## Rotas

- `/` — portfólio público.
- `/orcamento` — ferramenta de orçamento para clientes.
- `/admin` — painel administrativo.

O botão "Use nossa ferramenta de orçamento" no portfólio abre `/orcamento` por padrão. O endereço externo opcional pode ser definido em `src/data/site.js`, na propriedade `orcamentoUrl`.

## Configuração do banco de dados

Execute no SQL Editor do Supabase o arquivo:

`supabase/migrations/20261121_client_quote_builder.sql`

A migração cria:
- `be_drinks`: catálogo público de receitas.
- `be_drink_costs`: custos e preço de referência, com acesso exclusivo ao administrador.
- `be_plans`: planos, preços, duração incluída e limites de seleção.
- `be_plan_drinks`: associação entre planos e drinks.

A migração também cadastra os cinco planos iniciais com preços zerados. Preencha os preços no painel antes de disponibilizar a ferramenta aos clientes. Ela usa a função administrativa `public.be_is_admin()`, já configurada nas etapas anteriores.

## Painel administrativo

- **Drinks:** receita, ingredientes, modo de preparo, imagem, volume, custo dos ingredientes, guarnição, copo/embalagem, outros custos, preço de referência e CMV.
- **Planos e cardápios:** preço-base, preço por convidado, horas incluídas, valor por hora adicional, quantidade de drinks disponíveis e limite de escolha do cliente; também associa os drinks permitidos em cada plano.
- **Serviços, estruturas e profissionais:** cadastro e precificação nos módulos existentes.
- **Orçamentos:** as solicitações enviadas pelo cliente são registradas em `be_quotes` com status `pending`, aguardando análise manual.

## Regras da ferramenta de orçamento

- O cliente escolhe um plano e seleciona exatamente o limite de drinks definido nele.
- Define a quantidade de convidados e a duração do serviço.
- Pode adicionar serviços, estruturas e profissionais ativos.
- O carrinho exibe os itens e o valor estimado.
- O pedido é enviado para análise; o envio não confirma a contratação.
- A estimativa considera preço-base do plano + preço por convidado + horas adicionais; serviços e estruturas usam seus modelos de cobrança cadastrados; profissionais usam valor-base + valor por hora.
- O cliente não recebe dados de custo ou CMV. Esses dados ficam na tabela administrativa separada.

## Segurança

Nunca coloque a chave `service_role` no frontend. O projeto deve usar somente a URL do Supabase e a chave publicável/anon no arquivo local `.env`, que não deve ser versionado. A tabela de custos de drinks tem política RLS exclusiva para administradores.

## Build

```bash
npm run build
```

Antes de publicar, cadastre os drinks, associe as opções aos planos e preencha os preços comerciais.
