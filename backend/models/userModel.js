const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    telefon: {
      type: String,
      required: [true, "Please add a telefon"],
      unique: true,
    },
    location: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
