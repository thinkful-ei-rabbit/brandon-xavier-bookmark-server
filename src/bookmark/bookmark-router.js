const express = require("express");
const { v4: uuid } = require("uuid");
const { bookmarks } = require("../store");
const logger = require("../logger");

const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter
  .route("/")
  .get((req, res) => {
    res.json(bookmarks);
  })
  .post(bodyParser, (req, res) => {
    const { title, description, rating, url } = req.body;
    const id = uuid();
    const newBookmark = {
      id,
      title,
      description,
      rating,
      url,
    };
    if (!title) {
      return res.status(400).send("Please enter a title");
    }
    if (!description) {
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

bookmarkRouter
  .route("/:id")
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find((c) => c.id == id);

    // make sure we found a card
    if (!bookmark) {
      logger.error(`bookmark with id ${id} not found.`);
      return res.status(404).send("Bookmark Not Found");
    }

    res.json(bookmark);
  })
  .delete((req, res) => {
    const { id } = req.params;

    const index = bookmarks.findIndex((u) => u.id === id);

    // make sure we actually find a user with that id
    if (index === -1) {
      return res.status(404).send("bookmark not found");
    }

    bookmarks.splice(index, 1);

    res.send("bookmark deleted");
  });

module.exports = bookmarkRouter;
