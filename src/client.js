const fs = require('fs');
const { EventEmitter } = require('events');
const { readFileStream } = require('./readFileStream.js');

const CHAT_DIR = './.chat';

const createConnection = ({ username, name }, fileWriter) => {
  const SERVER_CONNECTION = './.chat/connections';

  const connectionInfo = JSON.stringify({ username, name });

  fileWriter(SERVER_CONNECTION, connectionInfo, {
    encoding: 'utf8',
    flag: 'a'
  });
};

const parseResponse = (response) => {
  const { user, message } = JSON.parse(response);
  return {
    sender: user,
    message
  };
};

class ServerConnection {
  #emitter;
  #writeStream;
  constructor(user, writeStream) {
    this.user = user;
    this.#emitter = new EventEmitter();
    this.#writeStream = writeStream;
  }

  connect() {
    createConnection(this.user, fs.writeFileSync);
    setTimeout(() => {
      this.#listen();
    }, 100);
  }

  on(eventName, cb) {
    this.#emitter.on(eventName, (response) => {
      const { sender, message } = parseResponse(response);
      cb(sender, message);
    });
  }

  #listen() {
    const chatFile = `${CHAT_DIR}/${this.user.username}/newMessages`;
    readFileStream(chatFile, (response) => {
      if (response) {
        this.#emitter.emit('new-message', response);
      }
    })
  }

  send(message) {
    this.#writeStream.write(message);
  }
}

const formateMessage = (message, sender) => {
  return `\n${sender.name} says :\n${message}`;
};

const main = (username, name) => {
  const user = {
    username, name
  };

  const userSentMessageFile = `${CHAT_DIR}/${user.username}/userSentMessages`;

  const writeStream = fs.createWriteStream(userSentMessageFile, 'utf8');

  const serverConnection = new ServerConnection(user, writeStream);
  serverConnection.connect();

  serverConnection.on('new-message', (sender, message) => {
    console.log(formateMessage(message, sender));
  });

  process.stdin.on('data', (message) => {
    serverConnection.send(message);
  });
};

const [username, name] = process.argv.slice(2);
main(username, name);
