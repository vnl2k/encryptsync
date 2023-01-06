import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { createReadStream } from "node:fs";

import { createHash } from "node:crypto";

// const openpgp = require("openpgp");

export const toHash = (file: string) => {
  return new Promise<string>((resolve, reject) => {
    const hash = createHash("sha256");
    const input = createReadStream(file);
    input
      .once("error", (err) => {
        console.log(err)
        reject("got it wrong")
      })
      .pipe(hash)
      .setEncoding("hex")
      .once("finish", () => {
        resolve(hash.read());
      });
  });
};

export interface GPGencryptionOptionsI {
  email: string;
}

export type GPGEncryptor = (sourceFile: string) => Promise<ChildProcessWithoutNullStreams>;

export function GPGencryption({ email }: GPGencryptionOptionsI) {
  return (sourceFile: string) =>
    new Promise<ChildProcessWithoutNullStreams>((resolve) => {
      // trust-model = auto: Skip  key  validation  and  assume that used keys are always fully trusted.
      resolve(spawn("gpg", ["-e", "-r", email, "--trust-model", "always", "--output", "-", sourceFile]));
    });
}

// function OpenPGPEncryption({ email }: {email: string}) {
//   return (sourceFile) => {
//     // const message = await openpgp.createMessage({ binary: new Uint8Array([0x01, 0x01, 0x01]) });
//     // const encrypted = await openpgp.encrypt({
//     //     message, // input as Message object
//     //     passwords: ['secret stuff'], // multiple passwords possible
//     //     format: 'binary' // don't ASCII armor (for Uint8Array output)
//     // });
//     // console.log(encrypted); // Uint8Array
//     // const encryptedMessage = await openpgp.readMessage({
//     //     binaryMessage: encrypted // parse encrypted bytes
//     // });
//     // const { data: decrypted } = await openpgp.decrypt({
//     //     message: encryptedMessage,
//     //     passwords: ['secret stuff'], // decrypt with password
//     //     format: 'binary' // output as Uint8Array
//     // });
//     // console.log(decrypted); // Uint8Array([0x01, 0x01, 0x01])
//   };
// }
