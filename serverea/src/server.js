const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/needs", require("./routes/need.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/search", require("./routes/search.routes"));
app.use("/api/inperson-search", require("./routes/inperson.routes"));
app.use("/api/analytics", require("./routes/analytics.routes"));


app.get("/api/health", (req, res) => {
  res.json({ status: "Backend OK 🚀" });
});

connectDB();

const PORT = process.env.PORT || 5001; // Default to 5001
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
