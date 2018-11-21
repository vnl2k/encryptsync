"use strict";

const { monitor } = require("./encrypt.js"),
  CONFIG_PATH = process.argv[2];

if (CONFIG_PATH == undefined) {
  console.log("Please provide a config file.");
  process.exit(1);
}

monitor(CONFIG_PATH);
