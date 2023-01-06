import * as Fs from "node:fs";

// const Chokidar = require("chokidar");

// const Crypto = require("crypto"),
//   Path = require("path"),
//   Fs = require("fs"),
//   FsPromise = require("fs").promises;

export type LoggerI = (message: string) => void;

export interface ConfigI {
  source_path: string;
  target_path: string;
  email: string;
}

export const logMessage =
  (log_path: string, tags: string, toConsole = true) =>
  (message: string) => {
    let fullMessage = `[${new Date().toLocaleTimeString()}] [${tags}] ${message}`;

    if (toConsole === true) console.log(fullMessage);

    Fs.appendFile(log_path, fullMessage + "\n", "utf8", (err: any) => {
      if (err) throw err;
    });
  };

// // NOT IN USE ATM
// function deleteGPGFiles(files) {
//   Promise.all(files.map(f => FsPromise.unlink(f)))
//     .then(() => console.log(files))
//     .catch(err => console.log(err));
// }

// // NOT IN USE ATM
// const sha256Name = file => {
//   const fileName = Path.basename(file),
//     sha256 = Crypto.createHash('sha256');

//   sha256.update(fileName);
//   return sha256.digest('hex');
// };

// export const compareTrees = (source_path: string, target_path: string) => {
//   let Watcher = Chokidar.watch(source_path, {
//     ignoreInitial: false,
//     persistent: true,
//   });
//   // console.log(Watcher.getWatched());
// };
