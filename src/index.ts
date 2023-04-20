import { existsSync, realpathSync, readFileSync } from "node:fs";
import * as Path from "node:path";

import { monitor } from "./encrypt";
import { logMessage, ConfigI } from "./utils";

const KEY_LOOKUP: { [key: string]: string } = {
  "--source": "source_path",
  "--target": "target_path",
  email: "email",
  "--logging": "logging",
};

function getKeyValuePair(key: string): [string, string] | undefined {
  let ind = process.argv.indexOf(key);
  if (ind > -1 && process.argv[ind + 1] !== undefined) {
    return [KEY_LOOKUP[key], process.argv[ind + 1]];
  }

  return;
}

function resolveConfig() {
  let cli_config = getKeyValuePair("--config");
  const home_path = process.env.HOME;
  
  const config_paths = [
    cli_config ? cli_config[1] : undefined,
    home_path !== undefined ? Path.join(home_path, ".encryptsyncrc") : undefined,
    Path.join(process.cwd(), ".encryptsyncrc"),
    "./.encryptsyncrc",
  ].filter((i: string | undefined) => {
    if (i === undefined) return false;
    return existsSync(i);
  }) as string[];

  if (config_paths.length > 0) return realpathSync(config_paths[0]);

  return;
}

function getCliConfig(): ConfigI | undefined {
  const res = ["--target", "--source", "--email"].map((key) => getKeyValuePair(key)).filter((i) => i !== undefined);

  if (res.length < 4) return;

  // @ts-ignore
  return res.reduce((o: ConfigI, i: [string, string]) => {
    // @ts-ignore
    o[i[0]] = i[1];
    return o;
  }, {});
}

function main() {
  let config: ConfigI | undefined;
  let log_path: string;

  const config_path = resolveConfig();
  if (config_path !== undefined) {
    config = JSON.parse(readFileSync(config_path, { encoding: "utf-8" }));
    log_path = Path.join(Path.dirname(config_path), "encryptsync.db");
  } else {
    config = getCliConfig();
    log_path = Path.join(process.cwd(), "encryptsync.db");
  }

  const opsLogger = logMessage(log_path, "info", config && config.logging === "debug");
  const errLogger = logMessage(log_path, "error", config && config.logging === "debug");

  if (config !== undefined) {
    monitor(config, opsLogger, errLogger);
  
  } else {
    errLogger(
      `ERROR: Could not locate \`.encryptsyncrc\` config file. Or, the starting parameters are missing. Please specify \`--target\`, \`--source\` and \`--email\`
Encrypt-Sync will exit.`
    );

    setTimeout(() => process.exit(1), 10);
  }
}

main();
