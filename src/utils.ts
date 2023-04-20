// import * as Fs from "node:fs";
// import { stdout } from 'node:process';
// import * as Path from "node:path";
// import * as PouchDB from "pouchdb";
import { randomUUID } from "node:crypto";
import { Database as SQLite3Databse} from "sqlite3";

export type LoggerI = (message: string) => void;

export interface ConfigI {
  source_path: string;
  target_path: string;
  email: string;
  logging: "db" | "debug";
}

const __toMessage = (uuid: string, timestamp: string, tags: string, message: string): [string, string[]] => {
  return [`[${timestamp}] [${tags}] ${message}\n`, [uuid, timestamp, tags, message]];
};

export const logMessage = (log_path: string, tags: string, toConsole = true) => {
  // const db = initPouchDB();
  const dbSQL = initSqlite3(log_path);

  // this is already returning a function
  return (message: string) => {
    const [fullMessage, db_record] = __toMessage(randomUUID(), new Date().toTimeString(), tags, message);

    // outputs to the console log as well for debugging purposes
    if (toConsole === true) {
      console.log(fullMessage);
    }

    // Fs.appendFile(log_path, fullMessage, "utf8", (err: any) => {
    //   if (err) throw err;
    // });

    dbSQL.run("INSERT INTO tblLogs VALUES (?, ?, ?, ?)", db_record)
  };
};

// export const initPouchDB = () => {
//   const db = new PouchDB("./dist/logs", { adapter: "leveldb" });
//   // see https://pouchdb.com/api.html#create_database
//   return db
// };


export const initSqlite3 = (db_path: string) => {
  const db = new SQLite3Databse(db_path);
  return db

}

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
