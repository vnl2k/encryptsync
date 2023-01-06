import * as Path from "node:path";
import { createWriteStream, mkdirSync, unlinkSync, rmdirSync } from "node:fs";
import * as fsp from "node:fs/promises";
import * as Chokidar from "chokidar";

import { ConfigI, LoggerI } from "./utils";
import { GPGencryption as encryptorTemplate, GPGencryptionOptionsI, GPGEncryptor } from "./encryptors";
import { ChildProcessWithoutNullStreams } from "node:child_process";

const file_extention = ".gpg";

const getRelativePath = (file: string, source: string) => file.replace(source, "");
const getTargetPath = (file: string, source: string, target: string) => file.replace(source, target);

export function encryptFile(encryptor: GPGEncryptor, file_extention: string, source_path: string, target_path: string) {
  return (f: string) => {
    let target_file = getTargetPath(f, source_path, target_path) + file_extention;

    // check that the target folder path exists
    let targetFilePath = Path.dirname(target_file);

    // if the target folder does NOT exist, create it
    let targetFolderCheck = fsp.stat(targetFilePath).catch(() => fsp.mkdir(targetFilePath, { recursive: true }));

    // check the file exists: fsp.stat(f)
    return Promise.all([fsp.stat(f), targetFolderCheck]).then(() =>
      encryptor(f).then(
        (gpg) =>
          new Promise<string>((resolve, reject: (reason: string) => void) => {
            gpg.stderr.on("message", (message: string) => reject(`GPG std error: ${message}`));
            gpg.on("error", (message: string) => reject(`GPG error: ${message}`));
            gpg.stdout.on("close", () => resolve(target_file)).on("error", (message: string) => reject(message));

            gpg.stdout.pipe(createWriteStream(target_file));
          })
      )
    );
  };
}

export const monitor = (config: ConfigI, opsLogger: LoggerI, errLogger: LoggerI) => {
  try {
    const source_path = Path.resolve(config.source_path),
      target_path = Path.resolve(config.target_path),
      options = {
        email: config.email,
      };

    opsLogger("Starting encryption monitor (v1.0.0)");
    opsLogger(`Watching folder: ${source_path}`);
    opsLogger("To exit press: CTRL + C");

    const encryptor = encryptFile(encryptorTemplate(options), file_extention, source_path, target_path);
    let Watcher = Chokidar.watch(source_path, {
      ignoreInitial: true,
      ignored: /(^|[/\\])\../,
      persistent: true,
    });

    Watcher.on("add", (path: string) =>
      encryptor(path)
        .then((enc_path) => opsLogger(`Encrypted: ${getRelativePath(enc_path, source_path)}\n`))
        .catch((err) => errLogger(err.message || err))
    )
      .on("addDir", (path: string) => {
        mkdirSync(getTargetPath(path, source_path, target_path), { recursive: true });
        opsLogger(`Added folder: ${getRelativePath(path, source_path)}\n`);
      })
      .on("change", (path: string) => {
        encryptor(path)
          .then((enc_path) => opsLogger(`Encrypted: ${getRelativePath(enc_path, source_path)}\n`))
          .catch((err) => errLogger(err.message || err));
      })
      .on("unlink", (path: string) => {
        unlinkSync(getTargetPath(path, source_path, target_path) + file_extention);
        opsLogger(`Removed file: ${getRelativePath(path, source_path)}\n`);
      })
      .on("unlinkDir", (path: string) => {
        rmdirSync(getTargetPath(path, source_path, target_path), { recursive: true });
        opsLogger(`Removed folder: ${getRelativePath(path, source_path)}\n`);
      });

    if (process.platform === "win32") {
      var rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.on("SIGINT", function () {
        process.emit("SIGINT");
      });
    }

    process.on("SIGINT", function () {
      opsLogger("\nGoodbye!");
      Watcher.close();
      process.exit(0);
    });

    return Watcher;
  } catch (err: any) {
    errLogger(err);
    setTimeout(() => process.exit(1), 10);
  }
};
