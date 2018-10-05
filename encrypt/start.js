"use strict";

const { monitor } = require("./encrypt.js"),
  EMAIL = process.argv[2],
  DESTINATION_PATH = process.argv[4] || process.env.HOME + "/Dropbox",
  SOURCE_PATH = process.argv[3] || process.cwd();

if (EMAIL == undefined) {
  console.log(
    "Please provide recepient email, e.g.\n sudo npm run monitor john.smith@mail.com"
  );
  process.exit(1);
}

monitor(EMAIL, SOURCE_PATH, DESTINATION_PATH);
