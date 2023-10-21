const express = require("express");
const { friendRequest, getAllFriends } = require("./friendsController");
const router = express.Router();
const { auth } = require("../middleware/authUser");

router.post("/friendrequest", auth, friendRequest);
router.get("/get-friends", auth, getAllFriends);

module.exports = router;
