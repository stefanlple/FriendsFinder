const express = require("express");
const {
  askForPermission,
  getRequestFromFriend,
  acceptRequestFromFriend,
  declineRequestFromFriend,
  getLocationFromFriend,
  deleteAllRequestsFromFriend,
  getMyRequestToFriend,
} = require("../controllers/permissonController");
const router = express.Router();
const { auth } = require("../middleware/authUser");

router.post("/permission-request", auth, askForPermission);
router.post("/get-request", auth, getMyRequestToFriend);
router.delete("/delete-all-request", auth, deleteAllRequestsFromFriend);

router.get("/get-request-from-friend", auth, getRequestFromFriend);
router.post("/accept-request", auth, acceptRequestFromFriend);
router.post("/decline-request", auth, declineRequestFromFriend);

router.post("/get-location-from-friend", auth, getLocationFromFriend);

module.exports = router;
