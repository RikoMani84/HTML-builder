
const { readdir, mkdir, copyFile, rm } = require('fs/promises');
const path = require('path');

async function copyFolder(
  pathToSrcFolder,
  pathToDestFolder,
  options = { deepCopy: false, destFolderCleared: false }
) {
  try {
    if (!options.destFolderCleared) {
      await rm(pathToDestFolder, { recursive: true, force: true });
    }

    await mkdir(pathToDestFolder);

    const dirEntries = await readdir(pathToSrcFolder, {
      withFileTypes: true,
    });

    for (const dirent of dirEntries) {
      if (dirent.isFile()) {
        const pathToSrcFile = path.join(pathToSrcFolder, dirent.name);
        const pathToDestFile = path.join(pathToDestFolder, dirent.name);

        copyFile(pathToSrcFile, pathToDestFile);
      }

      if (dirent.isDirectory() && options.deepCopy) {
        copyFolder(
          path.join(pathToSrcFolder, dirent.name),
          path.join(pathToDestFolder, dirent.name),
          { deepCopy: true, destFolderCleared: true }
        );
      }
    }
  } catch (err) {
    console.log(err);
  }
}

copyFolder(path.join(__dirname, 'files'), path.join(__dirname, 'files-copy'), {
  deepCopy: true,
});