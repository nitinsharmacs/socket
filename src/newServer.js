const { connect } = require('./socket/socket-server.js');

const startServer = (socketIo) => {
  socketIo.on('join', (data) => {
    console.log(data);
  });


  socketIo.on('from-new-client', (data) => {
    socketIo.emit('new-message-from-new-client', data);
  });

  socketIo.on('from-client2', (data) => {
    socketIo.emit('new-message', data);
  });
};

const main = () => {
  connect('http://google.com', (io) => {
    console.log('socket connected');
    console.log(io);
    startServer(io);
  });
};

main();
