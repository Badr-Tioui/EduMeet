const router = require("express").Router();
const { trackActivity, getDashboardStats } = require("../controllers/analytics.controller");

// si tu as un middleware auth, mets-le ici: router.use(auth)
router.post("/track", trackActivity);
router.get("/dashboard", getDashboardStats);

module.exports = router;
