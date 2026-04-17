const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    genre: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      required: true,
    },
    rating: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    bookedSeats: {
      type: [String],
      default: [],
      required: false,
      // Format: "row-col" e.g., "0-1", "2-5"
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Movie", movieSchema);
