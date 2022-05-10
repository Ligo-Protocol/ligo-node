var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var apiv0SmartcatRouter = require("./routes/api/v0/smartcar");
var apiv0ChainlinkRouter = require("./routes/api/v0/chainlink");

var publicApp = express();
var chainlinkApp = express();

[publicApp, chainlinkApp].forEach((app) => {
  app.use(logger("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, "public")));
});

publicApp.use("/api/v0/smartcar", apiv0SmartcatRouter);
chainlinkApp.use("/api/v0/chainlink", apiv0ChainlinkRouter);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

var publicAppPort = normalizePort(process.env.PORT || "3000");
var chainlinkAppPort = normalizePort(process.env.PORT_CHAINLINK || "3001");

publicApp.listen(publicAppPort, () => {
  console.log(`Public app listening on port ${publicAppPort}`);
});

chainlinkApp.listen(chainlinkAppPort, () => {
  console.log(
    `Chainlink External Adapter app listening on port ${chainlinkAppPort}`
  );
});
