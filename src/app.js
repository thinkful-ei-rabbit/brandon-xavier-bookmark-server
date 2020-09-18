require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");
const winston = require("winston");
const { v4: uuid } = require("uuid");
const app = express();

const morganOption = NODE_ENV === "production" ? "tiny" : "common";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "info.log" })],
});

if (NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// const bookmarks = [{
//   url: 1,
//   name: 'Task One',
//   description: 'This is card one',
//   rating: "",
//   id = "",
// }];

const bookmarks = [];

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get("Authorization");

  if (!authToken || authToken.split(" ")[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`);
    return res.status(401).json({ error: "Unauthorized request" });
  }
  // move to the next middleware
  next();
});

app.get("/bookmarks", (req, res) => {
  res.json(bookmarks);
});

app.get("/bookmarks/:id", (req, res) => {
  const { id } = req.params;
  const bookmark = bookmarks.find((c) => c.id == id);

  // make sure we found a card
  if (!bookmark) {
    logger.error(`bookmark with id ${id} not found.`);
    return res.status(404).send("Bookmark Not Found");
  }

  res.json(bookmark);
});

app.post("/bookmarks", express.json(), (req, res) => {
  const { title, desc, rating, url } = req.body;
  const id = uuid();
  const newBookmark = {
    id,
    title,
    desc,
    rating,
    url,
  };
  if (!title) {
    return res.status(400).send("Please enter a title");
  }
  if (!desc) {
    return res.status(400).send("Please enter a description");
  }
  if (!rating || rating > 5 || rating < 1) {
    return res.status(400).send("Please enter a valid rating from 1 to 5");
  }
  if (!url || !url.includes("http")) {
    return res.status(400).send("Please enter a valid url");
  }

  bookmarks.push(newBookmark);
  res.json(bookmarks);
});

app.delete("/bookmarks/:id", (req, res) => {
  const { id } = req.params;

  const index = bookmarks.findIndex((u) => u.id === id);

  // make sure we actually find a user with that id
  if (index === -1) {
    return res.status(404).send("bookmark not found");
  }

  bookmarks.splice(index, 1);

  res.send("bookmark deleted");
});

app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === "production") {
    response = { error: { message: "server error" } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;
