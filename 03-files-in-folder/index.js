const { readdir, stat } = require('fs/promises');
const path = require('path');
const { stderr, exit } = require('process');

(async () => {
  try {
    const folder = path.join(__dirname, './secret-folder');
    const content = await readdir(folder, { withFileTypes: true });
    const files = content.filter(c => c.isFile());
    files.forEach(async f => {
      const filePath = path.join(folder, f.name);
      const stats = await stat(filePath);
      const { name, ext } = path.parse(filePath);
      console.log(`${name} - ${ext.slice(1)} - ${stats.size}b`);
    });
  } catch (error) {
    stderr.write('Error: ' + error.message);
    exit(1);
  }
})();