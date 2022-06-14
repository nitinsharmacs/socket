const fs = require('fs');

const CHAT_DIR = './.chat';

const main = () => {
  const dirents = fs.readdirSync(CHAT_DIR, { withFileTypes: true });
  const chatFiles = dirents.filter(dirent => dirent.isFile()).map(a => a.name);
  const userDirectories = dirents.filter(dirent => dirent.isDirectory()).map(a => a.name);

  chatFiles.forEach(chatFile => {
    fs.writeFileSync(`${CHAT_DIR}/${chatFile}`, '', 'utf8');
  });

  userDirectories.forEach(directory => {
    fs.rmSync(`${CHAT_DIR}/${directory}`, { recursive: true });
  })
};

main();