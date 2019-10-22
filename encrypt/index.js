"use strict";

const { encryptFiles, monitor } = require("./src/encrypt.js"),
  CONFIG_PATH = process.argv[2] || (process.env.HOME + "/.encryptsyncrc");

if (CONFIG_PATH == undefined) {
  console.log("Please provide a config file.");
  process.exit(1);
}

monitor(CONFIG_PATH, encryptFiles);
