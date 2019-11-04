"use strict";

const { monitor, encryptFile} = require("./src/encrypt"),
  CONFIG_PATH = process.argv[2] || (process.env.HOME + "/.encryptsyncrc");

monitor(CONFIG_PATH, encryptFile);
