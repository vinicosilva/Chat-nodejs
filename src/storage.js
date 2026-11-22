'use strict';

const fs = require('fs');
const path = require('path');

class MessageStore {
  constructor(file, limit = 500) {
    this.file = file;
    this.limit = limit;
    this.messages = [];
    this.nextId = 1;
    this.writing = Promise.resolve();
    this.load();
  }

  load() {
    try {
      const data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      if (Array.isArray(data)) {
        this.messages = data.slice(-this.limit);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.warn(`Não foi possível ler ${this.file}: ${err.message}. Começando com histórico vazio.`);
      }
    }
    const last = this.messages[this.messages.length - 1];
    this.nextId = last && Number.isInteger(last.id) ? last.id + 1 : this.messages.length + 1;
  }

  add(partial) {
    const message = { id: this.nextId++, ...partial };
    this.messages.push(message);
    if (this.messages.length > this.limit) {
      this.messages.splice(0, this.messages.length - this.limit);
    }
    this.save();
    return message;
  }

  recent(count = 50) {
    return this.messages.slice(-count);
  }

  save() {
    const snapshot = JSON.stringify(this.messages, null, 2);
    const tmp = `${this.file}.tmp`;
    this.writing = this.writing
      .then(async () => {
        await fs.promises.mkdir(path.dirname(this.file), { recursive: true });
        await fs.promises.writeFile(tmp, snapshot);
        await fs.promises.rename(tmp, this.file);
      })
      .catch((err) => console.error('Erro ao salvar mensagens:', err.message));
    return this.writing;
  }

  flush() {
    return this.writing;
  }
}

module.exports = { MessageStore };