const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

        type: {
            type: String,
            required: true,
            enum: ["page_view", "pdf", "video", "quiz", "presentiel"],
            index: true,
        },

        action: { type: String, default: "" }, // ex: "open", "close", "end"
        subject: { type: String, default: "", index: true }, // "Informatique", "Maths"...
        city: { type: String, default: "" }, // présentiel
        itemId: { type: String, default: "" }, // id du pdf/video/quiz (si tu en as)
        title: { type: String, default: "" }, // titre humain

        durationSec: { type: Number, default: 0 }, // temps passé
        score: { type: Number, default: null }, // quiz score 0..100
        meta: { type: Object, default: {} }, // extensible
    },
    { timestamps: true }
);

module.exports = mongoose.model("Activity", ActivitySchema);
