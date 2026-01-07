const router = require("express").Router();
const { trackActivity, getDashboardStats } = require("../controllers/analytics.controller");

router.post("/track", trackActivity);
router.get("/dashboard", getDashboardStats);

module.exports = router;
