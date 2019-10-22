"use strict";

const { encryptFiles, monitor } = require("./src/encrypt.js"),
  CONFIG_PATH = process.argv[2] || (process.env.HOME + "/.encryptsyncrc");

monitor(CONFIG_PATH, encryptFiles);
