const fs = require('fs');
const { EventEmitter } = require('events');
const { readFileStream } = require('../readFileStream.js');
const { jsonStringify, jsonParse } = require('../utils/jsonParser.js');

const resolveServerSocketPath = (serverAddress) => {
  return `./.socket/${serverAddress}`;
};

const setupClient = (serverAddress, socketId, cb) => {
  const clientDir = `./${resolveServerSocketPath(serverAddress)}/clients/${socketId}`;

  fs.mkdir(clientDir, { recursive: true }, (err) => {
    if (!err) {
      fs.writeFileSync(`${clientDir}/outbox`, '', 'utf8');
      fs.writeFileSync(`${clientDir}/inbox`, '', 'utf8');

      return cb(null);
    }
    cb(err)
  });
}

const createSocketId = () => {
  return Math.ceil(Math.random() * 99999);
};

class Socket {
  #emitter;
  #writeStream;
  constructor(socketId, serverAddress) {
    this.socketId = socketId;
    this.serverAddress = serverAddress;
    this.#writeStream = fs.createWriteStream(`${resolveServerSocketPath(this.serverAddress)}/clients/${this.socketId}/outbox`);
    this.#emitter = new EventEmitter();
  }

  on(eventName, cb) {
    this.#emitter.on(eventName, (...args) => {
      return cb(...args);
    });
  }

  watchInbox() {
    const serverSocket = resolveServerSocketPath(this.serverAddress);
    const clientInboxFile = `${serverSocket}/clients/${this.socketId}/inbox`;

    readFileStream(clientInboxFile, (chunk) => {
      const parsedChunk = jsonParse(chunk);
      this.#emitter.emit(parsedChunk.eventName, parsedChunk.data);
    });
  }

  emit(eventName, data) {
    this.#writeStream.write(jsonStringify({ eventName, data }));
  }
}

const connectClient = (serverAddress, socketId, data, cb) => {
  const serverSocketDir = resolveServerSocketPath(serverAddress);
  const connectionFile = `${serverSocketDir}/connections`;

  fs.appendFile(
    connectionFile,
    jsonStringify({ socketId, data }),
    { encoding: 'utf8' },
    (err) => {
      if (!err) {
        return cb(null);
      }
      return cb(err);
    });
};

const connect = (serverAddress, data, cb) => {
  const socketId = createSocketId();

  setupClient(serverAddress, socketId, () => {
    connectClient(serverAddress, socketId, data, () => {
      const socket = new Socket(socketId, serverAddress);
      socket.watchInbox();
      return cb(socket);
    });
  });
};

module.exports = { connect };
