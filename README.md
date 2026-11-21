# BAR EXPERIENCE — Portfólio

Portfólio digital em React + Vite, responsivo para celular e computador.

## Executar no Android com Termux
```bash
pkg update -y
pkg install nodejs-lts unzip -y
cd ~/bar_experience
npm install
npm run dev -- --host 0.0.0.0
```
Abra `http://127.0.0.1:5173` no navegador do celular. Para encerrar, pressione `CTRL + C` no Termux.

## Editar sem procurar pelo código inteiro

### 1. Identidade, textos institucionais e links
Arquivo: `src/data/site.js`

Edite:
- `name`: nome da empresa.
- `eyebrow`: texto curto acima do título.
- `slogan`: chamada principal.
- `description`: apresentação da empresa.
- `city`: região atendida.
- `orcamentoUrl`: endereço da ferramenta de orçamento (quando for vincular).
- `instagramUrl`: endereço do Instagram.

O botão "Use nossa ferramenta de orçamento" já está preparado. Quando tiver o endereço da ferramenta, basta colá-lo em `orcamentoUrl`.

### 2. Planos, descrições, drinks e imagens
Arquivo: `src/data/plans.js`

Cada plano possui:
- `name`: nome exibido.
- `tier`: categoria curta.
- `description`: descrição comercial.
- `drinks`: lista de opções do cardápio.
- `image`: endereço da fotografia.
- `featured`: define se o plano recebe destaque visual.

Para trocar uma imagem, substitua somente a URL do campo `image`.

### 3. Aparência
Arquivo: `src/styles.css`

Centraliza cores, fontes, tamanhos, espaçamentos e comportamento responsivo.

### 4. Estrutura da página
Arquivo: `src/App.jsx`

Contém os componentes e a organização das seções.

## Padrão editorial
Todo texto voltado ao cliente deve ser profissional, objetivo e natural. Não publicar marcadores de teste, frases genéricas, comentários sobre desenvolvimento, referências a conteúdo demonstrativo ou linguagem que pareça texto automático. Antes de publicar, revisar ortografia, nomes dos coquetéis, condições comerciais e informações de contato.

## Estado desta versão
- Página pública e responsiva.
- Cinco planos cadastrados.
- Imagens substituíveis por URL.
- Botões de orçamento preparados para receber o endereço da ferramenta.
- Ainda não possui painel administrativo, autenticação, banco de dados ou upload de imagens. Esses recursos serão desenvolvidos na próxima fase.
- As imagens externas exigem conexão com a internet.
