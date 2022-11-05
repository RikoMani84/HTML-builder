const { stdout } = process;
const path = require('path');
const { readdir, writeFile, stat } = require('fs/promises');
const fs = require('fs');

const sourcePath = path.join(__dirname, 'styles');
const targetPath = path.join(__dirname, 'project-dist');

async function createBundle(sourse, target) {
  try {
    const files = await readdir(sourse, { withFileTypes: true });
    const data = [];
    for (const file of files) {
      const extFile = path.extname(path.join(sourse, file.name));
      if (file.isFile() && extFile === '.css') {
        const size = await stat(path.join(sourse, file.name));
        const input = fs.createReadStream(path.join(sourse, file.name), { highWaterMark: size.size }, 'utf-8');
        for await (const chunk of input) {
          data.push(chunk);
        }
      }
    }
    await writeFile(path.join(target, 'bundle.css'), data.join('\n'), 'utf8');
  } catch (err) {
    stdout.write(`\nError: ${err.message}\n`);
  }
}

createBundle(sourcePath, targetPath);