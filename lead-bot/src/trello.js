import axios from 'axios';

const trelloApi = axios.create({
  baseURL: 'https://api.trello.com/1',
  timeout: 15000
});

function authParams(config) {
  return {
    key: config.trello.key,
    token: config.trello.token
  };
}

function normalize(value) {
  return String(value ?? '').toLowerCase();
}

export async function findCardByContactKey(config, contactKey) {
  const response = await trelloApi.get(`/lists/${config.trello.listId}/cards`, {
    params: {
      ...authParams(config),
      fields: 'id,name,desc,dateLastActivity'
    }
  });

  const target = normalize(contactKey);
  return response.data.find((card) => normalize(card.name).includes(target));
}

function buildCardName(contact) {
  return `${contact.displayName} (${contact.last4})`; 
}

function buildCardDesc(contact) {
  return [
    `Contato: ${contact.displayName}`,
    `Últimos 4 dígitos: ${contact.last4}`,
    `Mensagens não lidas: ${contact.unreadCount}`,
    `Último horário visível no WhatsApp: ${contact.timeLabel || 'não identificado'}`,
    `Chat ID: ${contact.chatId || 'não identificado'}`,
    `Atualizado em: ${new Date().toLocaleString('pt-BR')}`
  ].join('\n');
}

export async function createCard(config, contact) {
  const response = await trelloApi.post('/cards', null, {
    params: {
      ...authParams(config),
      idList: config.trello.listId,
      name: buildCardName(contact),
      desc: buildCardDesc(contact),
      pos: 'top'
    }
  });

  return response.data;
}

export async function updateCard(config, cardId, contact) {
  const response = await trelloApi.put(`/cards/${cardId}`, null, {
    params: {
      ...authParams(config),
      name: buildCardName(contact),
      desc: buildCardDesc(contact)
    }
  });

  return response.data;
}
