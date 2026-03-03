import 'dotenv/config';

function parseBool(value, fallback) {
  if (value === undefined) {
    return fallback;
  }
  return String(value).toLowerCase() === 'true';
}

function parseIntOr(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const config = {
  trello: {
    key: process.env.TRELLO_KEY,
    token: process.env.TRELLO_TOKEN,
    boardId: process.env.TRELLO_BOARD_ID,
    listId: process.env.TRELLO_LIST_ID
  },
  bot: {
    pollIntervalMinutes: parseIntOr(process.env.POLL_INTERVAL_MINUTES, 30),
    chatLimit: parseIntOr(process.env.CHAT_LIMIT, 120),
    dryRun: parseBool(process.env.DRY_RUN, true),
    onlyUnread: parseBool(process.env.ONLY_UNREAD, true)
  }
};

export function validateConfig() {
  const missing = [];
  if (!config.trello.key) missing.push('TRELLO_KEY');
  if (!config.trello.token) missing.push('TRELLO_TOKEN');
  if (!config.trello.boardId) missing.push('TRELLO_BOARD_ID');
  if (!config.trello.listId) missing.push('TRELLO_LIST_ID');

  if (missing.length > 0 && !config.bot.dryRun) {
    throw new Error(`Variáveis obrigatórias ausentes: ${missing.join(', ')}.`);
  }
}
