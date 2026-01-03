const mongoose = require("mongoose");

const needSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true }, // ex: "Python", "Algo", "Web"
    level: {
      type: String,
      enum: ["debutant", "intermediaire", "avance"],
      default: "debutant",
    },
    keywords: { type: [String], default: [] },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["en_attente", "en_cours", "termine"],
      default: "en_attente",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Need", needSchema);
