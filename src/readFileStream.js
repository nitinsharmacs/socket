const fs = require('fs');

const readFileStream = (filename, cb, start = 0) => {
  let bytesRead = start;
  const readStream = fs.createReadStream(filename, {
    encoding: 'utf8',
    start: bytesRead
  });

  readStream.on('data', (chunk) => {
    bytesRead += chunk.length;
    cb(chunk);
  });

  readStream.on('end', () => {
    setTimeout(() => {
      readFileStream(filename, cb, bytesRead);
    })
  })
};

module.exports = { readFileStream };
