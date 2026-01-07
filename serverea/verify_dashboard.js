const mongoose = require("mongoose");
const Activity = require("./src/models/Activity");
const { getDashboardStats } = require("./src/controllers/analytics.controller");
require("dotenv").config({ path: "./.env" });

const run = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/edumeet";
        await mongoose.connect(mongoURI);
        console.log("Connected to DB");

        // Mock Request/Response
        const userId = new mongoose.Types.ObjectId();
        console.log("Testing with UserID:", userId);

        // Seed Data
        await Activity.deleteMany({ userId });
        await Activity.create([
            { userId, type: "quiz", score: 80, title: "Quiz SQL" },
            { userId, type: "quiz", score: 90, title: "Quiz React" },
            { userId, type: "page_view", title: "Dashboard Visit" },
            { userId, type: "presentiel", city: "Fès", subject: "Maths", title: "Prof Ahmed" }
        ]);
        console.log("Seeded activities");

        const req = { query: { userId: userId.toString() } };
        const res = {
            json: (data) => {
                console.log("--- Dashboard Stats ---");
                console.log("Progress Level (Exp: 1):", data.progress.level);
                console.log("Total Hours (Exp: >0):", data.progress.totalHours);
                console.log("Completed Lessons (Exp: >=0):", data.progress.completedLessons);
                console.log("Streak (Exp: >=1):", data.streak);
                console.log("Recent Activities (Exp: 5):", data.recentActivities.length);
            },
            status: (code) => ({ json: (d) => console.log(`Error ${code}:`, d) })
        };

        await getDashboardStats(req, res);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
