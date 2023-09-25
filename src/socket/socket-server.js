const fs = require('fs');
const { EventEmitter } = require('events');
const { readFileStream } = require('../readFileStream.js');
const { jsonParse, jsonStringify } = require('../utils/jsonParser.js');

const resolveServerSocketPath = (serverAddress) => {
  return `./.socket/${serverAddress}`;
};

const setUpSocketDir = (serverId, cb) => {
  const socketDir = './.socket';
  fs.mkdir(`${socketDir}/${serverId}`, { recursive: true }, (err) => {
    if (!err) {
      fs.writeFile(`${socketDir}/${serverId}/connections`, '', 'utf8', (err) => {
        if (!err) {
          return cb(null, { status: 'success' });
        }
        cb(err);
      });
      return;
    }
    cb(err);
  });
};

const createWriteStreamOnInbox = (serverId, socketId) => {
  const socketPath = resolveServerSocketPath(serverId);
  return fs.createWriteStream(`${socketPath}/clients/${socketId}/inbox`, 'utf8');
};

class Socket {
  #emitter;
  #connectionFile;
  #writeStreams;
  constructor(serverId) {
    this.serverId = serverId;
    this.#emitter = new EventEmitter();
    this.#connectionFile = `./.socket/${this.serverId}/connections`
    this.#writeStreams = [];
  }

  on(eventName, cb) {
    this.#emitter.on(eventName, (...args) => {
      return cb(...args);
    });
  }

  watchConnections() {
    readFileStream(this.#connectionFile, (chunk) => {
      const parsedChunk = jsonParse(chunk);
      this.#emitter.emit('join', parsedChunk);

      this.#writeStreams.push(createWriteStreamOnInbox(this.serverId, parsedChunk.socketId));

      this.watchClientOutbox(parsedChunk.socketId);
    });
  }

  watchClientOutbox(clientSocketId) {
    const clientsDir = `${resolveServerSocketPath(this.serverId)}/clients`;

    readFileStream(`${clientsDir}/${clientSocketId}/outbox`, (chunk) => {
      const parsedChunk = jsonParse(chunk);
      this.#emitter.emit(parsedChunk.eventName, parsedChunk.data);
    });
  }

  emit(eventName, data) {
    this.#writeStreams.forEach(writeStream =>
      writeStream.write(jsonStringify({ eventName, data })));
  }
}

const connect = (serverId, cb) => {
  setUpSocketDir(serverId, () => {
    const serverSocket = new Socket(serverId);
    serverSocket.watchConnections();
    cb(serverSocket);
  });
};

module.exports = { connect };
