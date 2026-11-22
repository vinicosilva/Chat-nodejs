'use strict';

const WebSocket = require('ws');

const COLORS = ['green', 'yellow', 'blue', 'purple', 'pink', 'lime', 'amber', 'orange'];
const MAX_NAME = 20;
const MAX_MESSAGE = 500;
const HISTORY_SIZE = 50;
const HEARTBEAT_MS = 30000;

function createChatServer(httpServer, store) {
  const wss = new WebSocket.Server({ server: httpServer });
  const clients = new Map(); // ws -> { nome, cor }

  function send(ws, payload) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  function joinedClients() {
    return [...clients.entries()].filter(([, user]) => user.nome);
  }

  function broadcast(payload, except) {
    for (const [ws] of joinedClients()) {
      if (ws !== except) send(ws, payload);
    }
  }

  function nameTaken(nome) {
    const wanted = nome.toLowerCase();
    return joinedClients().some(([, user]) => user.nome.toLowerCase() === wanted);
  }

  function sendOnline() {
    broadcast({ type: 'online', users: joinedClients().map(([, user]) => user.nome) });
  }

  function systemMessage(text) {
    return { type: 'show-message', message: text, sender: 'Servidor', color: 'red', side: 'right', system: true, time: Date.now() };
  }

  function handleSetName(ws, user, text) {
    if (user.nome) return;
    if (!text || text.length > MAX_NAME) {
      return send(ws, { type: 'name-error', message: `Digite um nome de 1 a ${MAX_NAME} caracteres.` });
    }
    if (nameTaken(text)) {
      return send(ws, { type: 'name-error', message: 'Esse nome já está em uso. Escolha outro.' });
    }

    user.nome = text;
    send(ws, { type: 'joined', name: user.nome, color: user.cor });
    send(ws, {
      type: 'history',
      messages: store.recent(HISTORY_SIZE).map((m) => ({
        type: 'show-message',
        message: m.message,
        sender: m.sender,
        color: m.color,
        time: m.time,
        side: m.sender === user.nome ? 'left' : 'right',
      })),
    });
    broadcast(systemMessage(`${user.nome} entrou no chat!`), ws);
    sendOnline();
  }

  function handleSetMessage(ws, user, text) {
    if (!user.nome || !text) return;
    const saved = store.add({
      sender: user.nome,
      color: user.cor,
      message: text.slice(0, MAX_MESSAGE),
      time: Date.now(),
    });

    for (const [client] of joinedClients()) {
      send(client, {
        type: 'show-message',
        message: saved.message,
        sender: saved.sender,
        color: saved.color,
        time: saved.time,
        side: client === ws ? 'left' : 'right',
      });
    }
  }

  wss.on('connection', (ws) => {
    const user = { nome: '', cor: COLORS[Math.floor(Math.random() * COLORS.length)] };
    clients.set(ws, user);
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (raw) => {
      let data;
      try {
        data = JSON.parse(raw.toString());
      } catch (err) {
        return;
      }
      if (!data || typeof data.message !== 'string') return;
      const text = data.message.trim();

      if (data.type === 'set-name') handleSetName(ws, user, text);
      else if (data.type === 'set-message') handleSetMessage(ws, user, text);
    });

    ws.on('close', () => {
      clients.delete(ws);
      if (user.nome) {
        broadcast(systemMessage(`${user.nome} saiu do chat.`));
        sendOnline();
      }
    });

    ws.on('error', (err) => console.error('Erro no WebSocket:', err.message));
  });

  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, HEARTBEAT_MS);

  wss.on('close', () => clearInterval(heartbeat));

  return wss;
}

module.exports = { createChatServer };