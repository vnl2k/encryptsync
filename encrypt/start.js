"use strict";

const { monitor } = require("./encrypt.js"),
  EMAIL = process.argv[2],
  CONFIG_PATH = process.argv[3];

if (EMAIL == undefined) {
  console.log(
    "Please provide recepient email, e.g.\n sudo npm run monitor john.smith@mail.com"
  );
  process.exit(1);
}

monitor(EMAIL, CONFIG_PATH);
