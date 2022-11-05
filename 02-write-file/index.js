const { exec } = require('child_process');
const fs = require('fs');
const { EOL, platform } = require('os');
const { join } = require('path');
const { stdin, stdout, stderr, exit } = require('process');
const { pipeline } = require('stream');

try {
  const onExit = () => {
    stdout.write(`Process completed!${EOL}`);
    exit();
  };

  const ws = fs.createWriteStream(join(__dirname, './text.txt'));

  stdout.write(`Write text:${EOL}`);

  if(platform() === 'win32'){
    exec('git --version', (err, data) => {
      if (err) return;
      if (data.match(/^git version ([\d.]*)/)[1].replace(/\./g, '') <= '2353')
        stderr.write(
          'If you do cross-check in Git Bash, please update your Git Bash! You\'re using old version with some bug. Or you can use another terminal.${EOL}You can check info about issue here: https://github.com/microsoft/terminal/issues/12298#issuecomment-1029270048'
        );
    });
  }

  stdin.on('data', data => {
    if (data.toString() === `exit${EOL}`) onExit();
  });

  process.on('SIGINT', onExit);

  pipeline(stdin, ws, err => {
    if (err) {
      stderr.write(`Error: ${err.message}`);
      exit(1);
    }
  });
} catch (error) {
  stderr.write(`Error: ${error.message}`);
  exit(1);
}