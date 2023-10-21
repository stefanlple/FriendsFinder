const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
    },
    friend: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Permission", permissionSchema);
