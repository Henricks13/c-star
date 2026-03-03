import { config, validateConfig } from './config.js';
import { openWhatsAppSession, waitForLogin, scrapeChats } from './whatsapp.js';
import { loadState, saveState, upsertContact } from './store.js';
import { createCard, findCardByContactKey, updateCard } from './trello.js';

function shouldProcess(chat) {
  if (config.bot.onlyUnread) {
    return chat.unreadCount > 0;
  }
  return true;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processLead(chat, state) {
  const contact = upsertContact(state, {
    ...chat,
    lastSeenInBotAt: new Date().toISOString()
  });

  if (config.bot.dryRun) {
    console.log(`[DRY_RUN] Lead detectado: ${contact.displayName} (${contact.last4}) | unread=${contact.unreadCount}`);
    return;
  }

  const existingCard = await findCardByContactKey(config, contact.contactKey);

  if (existingCard) {
    const updated = await updateCard(config, existingCard.id, contact);
    console.log(`Card atualizado: ${updated.name}`);
    return;
  }

  const created = await createCard(config, contact);
  console.log(`Card criado: ${created.name}`);
}

async function runCycle(page) {
  const chats = await scrapeChats(page, config.bot.chatLimit);
  const state = loadState();
  const pending = chats.filter(shouldProcess);

  console.log(`Chats lidos: ${chats.length} | Pendentes: ${pending.length}`);

  for (const chat of pending) {
    await processLead(chat, state);
  }

  saveState(state);
}

async function main() {
  validateConfig();

  const { context, page } = await openWhatsAppSession();

  try {
    console.log('Aguardando login no WhatsApp Web (QR code)...');
    await waitForLogin(page);
    console.log('Login detectado. Bot iniciado.');

    await runCycle(page);

    const intervalMs = config.bot.pollIntervalMinutes * 60 * 1000;
    while (true) {
      await sleep(intervalMs);
      await runCycle(page);
    }
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error('Falha no bot:', error.message);
  process.exit(1);
});
