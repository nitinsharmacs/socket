const fs = require('fs');
const { readFileStream } = require('./readFileStream.js');

const CHAT_DIR = './.chat';
const SERVER_CONNECTION = './.chat/connections';

const createUserFiles = ({ username }) => {
  const userDir = `${CHAT_DIR}/${username}`;
  const newMessages = `${userDir}/newMessages`;
  const userSentMessages = `${userDir}/userSentMessages`;
  const newConnections = `${userDir}/newConnections`;

  fs.mkdirSync(userDir);

  fs.writeFileSync(newMessages, '', {
    flag: 'a', encoding: 'utf8'
  });

  fs.writeFileSync(userSentMessages, '', {
    flag: 'a', encoding: 'utf8'
  });

  fs.writeFileSync(newConnections, '', {
    flag: 'a', encoding: 'utf8'
  });

  return {
    newMessages, userSentMessages, newConnections
  };
};

class User {
  #writeStream;
  constructor(
    { username, name },
    { newMessages, userSentMessages, newConnections },
    writeStream
  ) {
    this.username = username;
    this.name = name;
    this.newMessages = newMessages;
    this.userSentMessages = userSentMessages;
    this.newConnections = newConnections;
    this.#writeStream = writeStream;
  }

  send(sender, message) {
    this.#writeStream.write(JSON.stringify({
      message,
      user: sender
    }));
  }
}

const createUser = (userInfo) => {
  const connectionFiles = createUserFiles(userInfo);
  const writeStream = fs.createWriteStream(connectionFiles.newMessages, {
    encoding: 'utf8',
    flags: 'a'
  });

  return new User(userInfo, connectionFiles, writeStream);
};

const listen = (user, cb) => {
  readFileStream(user.userSentMessages, (message) => {
    cb(user, message);
  });
};

const broadCast = (connectedUsers, sender, message) => {
  const usersToSendMessage = connectedUsers.filter(
    user => user.username !== sender.username);
  usersToSendMessage.forEach(user => {
    user.send(sender, message);
  })
};

const main = () => {
  const connectedUsers = [];

  readFileStream(SERVER_CONNECTION, (user) => {
    const newUser = createUser(JSON.parse(user));

    connectedUsers.push(newUser);

    listen(newUser, (sender, message) => {
      broadCast(connectedUsers, sender, message);
    });
  });
};

main();
