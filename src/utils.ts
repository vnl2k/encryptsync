import * as Fs from "node:fs";
// import { stdout } from 'node:process';
// import * as Path from "node:path";
// import * as PouchDB from "pouchdb";
import { randomUUID } from "node:crypto";
// import { Interface } from "node:readline";
import { Database as SQLite3Databse } from "sqlite3";

export type LoggerI = (message: string, context?: LogContext | LogContextDelete | null) => void;

export interface ConfigI {
  source_path: string;
  target_path: string;
  email: string;
  logging: "db" | "debug";
}

export interface LogContext {
  hash: string;
  path: string;
  type: "create" | "update" | "delete";
}

export interface LogContextDelete {
  hash: undefined;
  path: string;
  type: "delete";
}

// this is a fallback option in case SQLite3 is not available on the system
class FileLogger {
  logfile: string;
  constructor(logfile_path: string) {
    this.logfile = logfile_path;
  }

  run(_: string, fullMessage: string[]) {
    Fs.appendFile(this.logfile, fullMessage.toString(), "utf8", (err: any) => {
      if (err) throw err;
    });
  }
}

const __toMessage = (uuid: string, timestamp: string, tags: string, message: string): [string, string[]] => {
  return [`[${timestamp}] [${tags}] ${message}\n`, [uuid, timestamp, tags, message]];
};

export const logMessage = (log_path: string, tags: string, toConsole = true) => {
  // const db = initPouchDB();
  const dbSQL = initSqlite3(log_path);

  // this returns a function
  return (message: string, context: LogContext | LogContextDelete | null = null) => {
    const timestamp = new Date().toISOString();
    const uuid = randomUUID();
    const [fullMessage, log_record] = __toMessage(uuid, timestamp, tags, message);

    // outputs to the console log as well for debugging purposes
    if (toConsole === true) {
      console.log(fullMessage);
    }

    if (context !== null) {
      dbSQL.run("INSERT INTO tblActivity VALUES (?, ?, ?, ?, ?)", [
        context?.path || "",
        context.type,
        timestamp,
        uuid,
        context?.hash || "",
      ]);
    } else {
      dbSQL.run("INSERT INTO tblLogs VALUES (?, ?, ?, ?)", log_record)
    }
  };
};

export const initSqlite3 = (db_path: string) => {
  try {
    const db = new SQLite3Databse(db_path);
    return db;
  } catch {
    return new FileLogger(db_path);
  }
};

// export const initPouchDB = () => {
//   const db = new PouchDB("./dist/logs", { adapter: "leveldb" });
//   // see https://pouchdb.com/api.html#create_database
//   return db
// };

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
