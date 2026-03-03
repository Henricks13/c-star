import path from 'node:path';
import { chromium } from 'playwright';

function sanitizeDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function getLast4FromText(...values) {
  const merged = values.map((value) => sanitizeDigits(value)).join('');
  if (merged.length < 4) {
    return '0000';
  }
  return merged.slice(-4);
}

function buildContactKey(contact) {
  return `${contact.displayName.toLowerCase()}-${contact.last4}`;
}

export async function openWhatsAppSession() {
  const userDataDir = path.resolve('.wweb-session');

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1440, height: 900 }
  });

  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto('https://web.whatsapp.com', { waitUntil: 'domcontentloaded' });
  return { context, page };
}

export async function waitForLogin(page) {
  await page.waitForSelector('#pane-side, [data-testid="chat-list"]', {
    timeout: 180000
  });
}

export async function scrapeChats(page, limit = 120) {
  const chats = await page.evaluate((internalLimit) => {
    const root = document.querySelector('#pane-side');
    if (!root) {
      return [];
    }

    const items = Array.from(root.querySelectorAll('div[role="listitem"]')).slice(0, internalLimit);

    return items.map((item) => {
      const nameElement = item.querySelector('span[dir="auto"]');
      const timeElement = item.querySelector('div[data-testid="cell-frame-title"] span');
      const unreadElement = item.querySelector('span[aria-label*="não lida" i], span[aria-label*="unread" i]');

      const displayName = nameElement?.textContent?.trim() || 'Contato sem nome';
      const timeLabel = timeElement?.textContent?.trim() || '';
      const unreadCountRaw = unreadElement?.textContent?.trim() || '0';
      const unreadCount = Number.parseInt(unreadCountRaw, 10);
      const chatId = item.getAttribute('data-id') || item.getAttribute('data-testid') || '';

      return {
        displayName,
        timeLabel,
        unreadCount: Number.isNaN(unreadCount) ? 0 : unreadCount,
        chatId
      };
    });
  }, limit);

  return chats
    .map((chat) => {
      const last4 = getLast4FromText(chat.chatId, chat.displayName);
      return {
        ...chat,
        last4,
        contactKey: buildContactKey({ ...chat, last4 })
      };
    })
    .filter((chat) => Boolean(chat.displayName));
}
