const fs = require('fs');
const { join } = require('path');
const { stdout, stderr, exit } = require('process');
const { pipeline } = require('stream');

try {
  const rs = fs.createReadStream(join(__dirname, './text.txt'));

  pipeline(rs, stdout, err => {
    if (err) {
      stderr.write('Error: ' + err.message);
      exit(1);
    }
  });
} catch (error) {
  stderr.write('Error: ' + error.message);
  exit(1);
}