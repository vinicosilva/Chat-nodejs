# Chat em tempo real com Node.js Desenvolvimento Voltado à Web III

Sistema de chat em que vários usuários se conectam ao mesmo tempo e trocam mensagens instantaneamente. Feito com Node.js, WebSockets (módulo `ws`) e um servidor HTTP nativo. As mensagens ficam salvas em um arquivo JSON e o histórico recente aparece para quem entra depois.

## Recursos

- Servidor HTTP que entrega a interface do chat (pasta `public/`).
- Módulo de WebSocket (`src/chatServer.js`) que gerencia conexões, nomes de usuário, cores, lista de quem está online e o envio das mensagens para todos.
- Módulo de armazenamento (`src/storage.js`) que persiste as mensagens em `data/messages.json`.
- HTTP e WebSocket funcionam na mesma porta.
- Reconexão automática do cliente se a conexão cair.

## Requisitos

- [Node.js](https://nodejs.org/) (inclui o npm).
- Um navegador atual

Para conferir se o Node.js está instalado, entre no Terminal e digite um comando por vez:

node -v
npm -v

## Instalação

1. Baixe o projeto e entre na pasta:

  No Terminal:
   git clone https://github.com/vinicosilva/Chat-nodejs.git
   cd chat-nodejs

2. Instale as dependências:

  No Terminal da pasta do projeto:
   npm install

## Como executar o servidor

  No Terminal da pasta do projeto:
   npm start

Deve aparecer no terminal:

Chat rodando em http://localhost:3000

Para encerrar o servidor, pressione `Ctrl + C` no terminal. As mensagens pendentes são gravadas antes de ele fechar.

## Como acessar no navegador

1. Abra **http://localhost:3000** (ou a porta que você escolheu).
2. Digite seu nome e clique em **Entrar no chat**.
3. Para ver a troca de mensagens em tempo real, abra uma segunda aba (ou outro navegador), entre com outro nome e converse entre as duas.

Para conversar com outras pessoas na mesma rede, descubra o IP da sua máquina e acesse `http://SEU_IP:3000` nos outros dispositivos.

## Armazenamento das mensagens

As mensagens são gravadas em `data/messages.json`, que é criado automaticamente na primeira mensagem enviada.
Para limpar o histórico, pare o servidor e apague o arquivo `data/messages.json`.

## Estrutura do projeto

chat-nodejs/
├── server.js          # Servidor HTTP + inicialização do WebSocket
├── src/
│   ├── chatServer.js  # Módulo que gerencia as conexões WebSocket
│   └── storage.js     # Armazenamento das mensagens em arquivo JSON
├── public/
│   ├── index.html     # Interface do chat
│   ├── css/style.css
│   └── js/chat.js     # Cliente WebSocket no navegador
├── data/              # Aqui é criado o messages.json
├── package.json
└── README.md