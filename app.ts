var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var apiv0SmartcatRouter = require("./routes/api/v0/smartcar");
var apiv0ChainlinkRouter = require("./routes/api/v0/chainlink");

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/api/v0/smartcar", apiv0SmartcatRouter);
app.use("/api/v0/chainlink", apiv0ChainlinkRouter);

module.exports = app;
