const fsPromises = require('fs/promises');
const fs = require('fs');
const path = require('path');
const { stdout, stderr } = require('process');

const dirDist = path.join(__dirname, 'project-dist');

const dirAssets = path.join(__dirname, 'assets');
const dirDistAssets = path.join(dirDist, 'assets');

const dirStyles = path.join(__dirname, 'styles');
const fileStyle = 'style.css';

const dirComponents = path.join(__dirname, 'components');
const fileTemplate = path.join(__dirname, 'template.html');
const fileIndex = path.join(dirDist, 'index.html');


const commentStatus = () => {
  const index = process.argv.indexOf('-c');
  return index === -1 ? true : !(process.argv[index + 1] === 'off');
};

const mergeStyles = async (dirSrc, dirDist, styleFileName, commentStatus = true) => {
  const fullName = path.join(dirDist, styleFileName);

  const streamWrite = fs.createWriteStream(fullName, 'utf-8');

  const files = await fsPromises.readdir(dirSrc, { withFileTypes: true });

  for (const file of files) {
    if (file.isFile()) {
      const fileName = path.join(dirSrc, file.name);

      if (path.extname(fileName) === '.css') {
        const streamRead = fs.createReadStream(fileName, 'utf-8');

        if (commentStatus) stdout.write(`merge ${fileName} -> ${fullName}\r\n`);
        streamRead.pipe(streamWrite);
      }
    }
  }
  return true;
};

const copyDir = async (dirSrc, dirDest, commentStatus = true) => {
  await fsPromises.rm(dirDest, { recursive: true, force: true });
  await fsPromises.mkdir(dirDest, { recursive: true });

  const files = await fsPromises.readdir(dirSrc, { withFileTypes: true });

  for (const file of files) {
    let pathSrcNew = path.join(dirSrc, file.name);
    let pathDestNew = path.join(dirDest, file.name);

    if (file.isFile()) {
      if (commentStatus) stdout.write(`copy ${pathSrcNew} -> ${pathDestNew}\r\n`);
      await fsPromises.copyFile(pathSrcNew, pathDestNew);
    } else {
      if (commentStatus) stdout.write(`copy dir ${pathSrcNew} -> ${pathDestNew}\r\n`);
      await copyDir(pathSrcNew, pathDestNew, commentStatus);
    }
  }
  return true;
};

async function readComponent(fullName) {
  return new Promise((resolve, reject) => {
    let text = '';
    const streamRead = fs.createReadStream(fullName, 'utf-8');

    streamRead.on('data', (chunk) => (text += chunk));
    streamRead.on('error', (err) => reject(err));
    streamRead.on('end', () => {
      resolve({ name: path.basename(fullName, '.html'), text: text + '\r\n' });
    });
  });
}

async function writeHTML(text, components, fileIndex, commentStatus = true) {
  components.forEach((component) => {
    text = text.split(`{{${component.name}}}`).join(component.text);
  });

  const streamWrite = fs.createWriteStream(fileIndex, 'utf-8');
  streamWrite.write(text);
  if (commentStatus) stdout.write(`build ${fileIndex}\r\n`);
}

async function buildHTML(fileTemplate, dirComponents, fileIndex, commentStatus = true) {
  const promises = [];
  const files = await fsPromises.readdir(dirComponents, { withFileTypes: true });

  for (const file of files) {
    if (file.isFile()) {
      const fullName = path.join(dirComponents, file.name);

      if (path.extname(fullName) === '.html') promises.push(readComponent(fullName));
    }
  }
  const components = await Promise.all(promises);

  const streamRead = fs.createReadStream(fileTemplate, 'utf-8');
  let text = '';

  streamRead.on('data', (chunk) => (text += chunk));
  streamRead.on('error', (error) => {
    throw error;
  });
  streamRead.on('end', () => writeHTML(text, components, fileIndex, commentStatus));
}

async function webpack(commentStatus = true) {
  await fsPromises.rm(dirDist, { recursive: true, force: true });
  await fsPromises.mkdir(dirDist, { recursive: true });

  const results = await Promise.allSettled([
    buildHTML(fileTemplate, dirComponents, fileIndex, commentStatus),
    copyDir(dirAssets, dirDistAssets, commentStatus),
    mergeStyles(dirStyles, dirDist, fileStyle, commentStatus),
  ]);

  results.forEach((result) => {
    if (result.status === 'rejected') {
      throw result.reason;
    }
  });
  return true;
}

(async () => {
  try {
    await webpack(commentStatus());
    stdout.write('Made. New build in ' + dirDist);
  } catch (err) {
    stderr.write('Failed. ' + err);
  }
})();