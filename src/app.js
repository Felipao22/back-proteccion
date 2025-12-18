const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const routes = require("./routes/index.js");

require("./db.js");

const server = express();
const cors = require("cors");

server.name = "API";

const ACCEPTED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3001",
  "http://localhost:8081",
  "http://api.back-proteccion.site",
];

server.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || ACCEPTED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // <- MUY IMPORTANTE
  })
);
server.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
server.use(bodyParser.json({ limit: "50mb" }));
server.use(cookieParser());
server.use(morgan("dev"));

server.use("/", routes);

// Error catching endware.
server.use((err, req, res, next) => {
  // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  const message = err.message || err;
  console.error(err);
  res.status(status).send(message);
});

module.exports = server;
