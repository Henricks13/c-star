# Lead Bot (MVP local)

Robô local para ajudar no follow-up de leads: lê conversas no WhatsApp Web e cria/atualiza cards no Trello.

## Fluxo do MVP

1. Abre WhatsApp Web no navegador automatizado (Playwright).
2. Lê lista de chats e identifica conversas pendentes (por padrão: não lidas).
3. Extrai nome/identificador do contato e últimos 4 dígitos disponíveis.
4. Cria ou atualiza card no Trello na lista configurada.

## Pré-requisitos

- Node.js 20+
- Conta Trello + key/token
- Quadro/lista no Trello para "Entrar em contato"

## Configuração

1. Copie `.env.example` para `.env`.
2. Preencha `TRELLO_KEY`, `TRELLO_TOKEN`, `TRELLO_BOARD_ID`, `TRELLO_LIST_ID`.
3. Instale dependências:

```bash
npm install
npx playwright install chromium
```

## Rodando

```bash
npm start
```

Na primeira execução, você faz login no WhatsApp Web via QR code.

## Observações importantes

- O scraping de WhatsApp Web depende da estrutura de UI e pode precisar ajustes no futuro.
- Use `DRY_RUN=true` para testar sem criar cards reais.
- Este MVP não substitui CRM completo; ele acelera triagem inicial de contatos.
