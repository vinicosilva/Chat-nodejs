'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const { MessageStore } = require('./src/storage');
const { createChatServer } = require('./src/chatServer');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');

const store = new MessageStore(MESSAGES_FILE);

const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
    return response.end('Método não permitido');
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch (err) {
    pathname = null;
  }
  if (!pathname || pathname.includes('\0')) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return response.end('Requisição inválida');
  }

  if (pathname === '/') pathname = '/index.html';

  const file = path.join(PUBLIC_DIR, pathname);
  if (!file.startsWith(PUBLIC_DIR + path.sep)) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return response.end('Acesso negado');
  }

  fs.readFile(file, (err, content) => {
    if (err) {
      response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return response.end('Página inválida');
    }
    response.writeHead(200, { 'Content-Type': mime.contentType(path.extname(file)) || 'application/octet-stream' });
    response.end(request.method === 'HEAD' ? undefined : content);
  });
});

createChatServer(server, store);

server.listen(PORT, () => {
  console.log(`Chat rodando em http://localhost:${PORT}`);
});

function shutdown() {
  console.log('\nEncerrando e salvando mensagens...');
  store.flush().finally(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);