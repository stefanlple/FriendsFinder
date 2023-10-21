const User = require("../models/userModel");
const Friends = require("./friendsModel");
const asyncHandler = require("express-async-handler");

const friendRequest = asyncHandler(async (req, res) => {
  const friendsUsername = req.body.friendsUsername;
  const userJson = req.user;
  const user = await User.findById(userJson._id);

  const friend = await User.findOne({ username: friendsUsername });
  if (!user) {
    res.status(400);
    throw new Error("No User");
  }

  if (!friendsUsername) {
    res.status(400);
    throw new Error("Add friend name");
  }

  if (!friend) {
    res.status(400);
    throw new Error("No Friend with that name");
  }

  const relationshipExist = await Friends.findOne({
    $or: [
      { user: user._id, friend: friend._id },
      { user: friend._id, friend: user._id },
    ],
  });

  if (relationshipExist) {
    res.status(402);
    throw new Error("Already befriended");
  }

  const relationShip = await Friends.create({
    user: user._id,
    friend: friend._id,
  });

  if (relationShip) {
    res.status(201);
    res.json(relationShip);
  }
});

const getAllFriends = asyncHandler(async (req, res) => {
  const userJson = req.user;
  const user = await User.findById(userJson._id);

  if (!user) {
    res.status(400);
    throw new Error("No User");
  }

  const friends = await Friends.aggregate([
    {
      $match: {
        $or: [{ user: user._id }, { friend: user._id }],
        status: "accepted",
      },
    },
  ]);
  res.json(friends);
});

module.exports = { friendRequest, getAllFriends };
