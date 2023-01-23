import * as Fs from "node:fs";
import * as Path from "node:path";
import * as sql from "sqlite3";
import { randomUUID } from "node:crypto";

export type LoggerI = (message: string) => void;

export interface ConfigI {
  source_path: string;
  target_path: string;
  email: string;
  logging: "file" | "console";
}

const __toMessage = (uuid: string, timestamp: string, tags: string, message: string): [string, string[]] => {
  return [`[${timestamp}] [${tags}] ${message}\n`, [uuid, timestamp, tags, message]];
};

export const logMessage =
  (log_path: string, tags: string, toConsole = true) =>
  (message: string) => {
    const db_path = Path.join(Path.dirname(log_path), "encryptsyncDB.sqlite3");

    const [fullMessage, db_record] = __toMessage(randomUUID(), new Date().toTimeString(), tags, message);

    // outputs to the console log as well for debugging purposes
    if (toConsole === true) console.log(fullMessage);

    Fs.appendFile(log_path, fullMessage, "utf8", (err: any) => {
      if (err) throw err;
    });

    // initSQLdb(db_path).then((db) => {
    //   db.run(`INSERT INTO ChangeLog VALUES (?) (?) (?) (?)`, db_record)
    // });
  };

// function initSQLdb(db_path: string) {
//   return new Promise<sql.Database>((resolve, reject) => {
//     const db = new sql.Database(db_path, sql.OPEN_READWRITE, (err) => {
//       if (err && err.name == "SQLITE_CANTOPEN") {
//         db.run(`
//           CREATE TABLE ChangeLog (
//               UUID      VARCHAR (37) PRIMARY KEY,
//               Timestamp DATETIME,
//               Tag       VARCHAR (5),
//               Message   TEXT
//           );
//         `, (err) => {
//           if (err) reject()
//             resolve(db)
//         });
//       } else if (err) {
//         console.log("Getting error " + err);
//         reject();
//       }
//       resolve(db);
//     });
//   });
// }

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
