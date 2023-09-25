const { connect } = require('./socket/socket-client.js');

const startClient = (socket) => {
  socket.on('new-message-from-new-client', (data) => {
    console.log(data);
  });

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    socket.emit('from-client2', { message: chunk.trim() });
  })
};

const main = () => {
  const client = {
    username: 'psycho'
  };

  connect('http://google.com', client, (io) => {
    console.log('socket connected');
    startClient(io);
  });
};

main();
