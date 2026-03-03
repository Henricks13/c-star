import fs from 'node:fs';
import path from 'node:path';

const statePath = path.resolve('data', 'state.json');

function ensureDataDir() {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
}

export function loadState() {
  ensureDataDir();

  if (!fs.existsSync(statePath)) {
    return { contacts: {} };
  }

  const raw = fs.readFileSync(statePath, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return { contacts: {} };
  }
}

export function saveState(state) {
  ensureDataDir();
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

export function upsertContact(state, contact) {
  const key = contact.contactKey;
  const current = state.contacts[key] ?? {};

  state.contacts[key] = {
    ...current,
    ...contact,
    updatedAt: new Date().toISOString()
  };

  return state.contacts[key];
}
