(() => {
  'use strict';

  const CORES = {
    green: '#2e9e4f', yellow: '#d9a400', blue: '#1e6fd9', purple: '#8e3fb5',
    pink: '#d6336c', lime: '#6aa312', amber: '#e08a00', orange: '#e8590c', red: '#c62828',
  };

  const $ = (id) => document.getElementById(id);
  const telaEntrar = $('tela-entrar');
  const telaChat = $('tela-chat');
  const formEntrar = $('form-entrar');
  const inputNome = $('nome');
  const erroNome = $('erro-nome');
  const lista = $('mensagens');
  const formMensagem = $('form-mensagem');
  const inputMensagem = $('mensagem');
  const status = $('status');
  const online = $('online');

  let ws = null;
  let nome = '';
  let entrou = false;

  function enviar(type, message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, message }));
      return true;
    }
    return false;
  }

  function definirStatus(texto, classe) {
    status.textContent = texto;
    status.className = `status ${classe}`;
  }

  function adicionarMensagem(dados) {
    const item = document.createElement('li');

    if (dados.system) {
      item.className = 'msg sistema';
      item.textContent = dados.message;
    } else {
      item.className = `msg ${dados.side === 'left' ? 'left' : 'right'}`;
      item.style.setProperty('--cor', CORES[dados.color] || CORES.blue);

      const cabecalho = document.createElement('div');
      const autor = document.createElement('span');
      autor.className = 'autor';
      autor.textContent = dados.sender;
      const hora = document.createElement('span');
      hora.className = 'hora';
      hora.textContent = new Date(dados.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      cabecalho.append(autor, hora);

      const texto = document.createElement('p');
      texto.className = 'texto';
      texto.textContent = dados.message;

      item.append(cabecalho, texto);
    }

    lista.append(item);
    lista.scrollTop = lista.scrollHeight;
  }

  function conectar() {
    const protocolo = location.protocol === 'https:' ? 'wss://' : 'ws://';
    ws = new WebSocket(protocolo + location.host);

    ws.onopen = () => {
      definirStatus('Conectado', 'ok');
      if (nome) enviar('set-name', nome);
    };

    ws.onmessage = (evento) => {
      let dados;
      try {
        dados = JSON.parse(evento.data);
      } catch (err) {
        return;
      }

      switch (dados.type) {
        case 'joined':
          entrou = true;
          nome = dados.name;
          telaEntrar.hidden = true;
          telaChat.hidden = false;
          inputMensagem.focus();
          break;
        case 'name-error':
          if (entrou) {
            setTimeout(() => enviar('set-name', nome), 2000);
          } else {
            nome = '';
            erroNome.textContent = dados.message;
          }
          break;
        case 'history':
          lista.replaceChildren();
          dados.messages.forEach(adicionarMensagem);
          break;
        case 'show-message':
          adicionarMensagem(dados);
          break;
        case 'online':
          online.textContent = `${dados.users.length} online`;
          online.title = dados.users.join(', ');
          break;
      }
    };

    ws.onclose = () => {
      definirStatus('Desconectado. Tentando reconectar...', 'off');
      setTimeout(conectar, 3000);
    };

    ws.onerror = () => ws.close();
  }

  formEntrar.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const digitado = inputNome.value.trim();
    if (!digitado) return;
    erroNome.textContent = '';
    nome = digitado;
    if (!enviar('set-name', nome)) {
      erroNome.textContent = 'Sem conexão com o servidor. Aguarde e tente novamente.';
    }
  });

  formMensagem.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const texto = inputMensagem.value.trim();
    if (!texto) return;
    if (enviar('set-message', texto)) inputMensagem.value = '';
  });

  conectar();
})();