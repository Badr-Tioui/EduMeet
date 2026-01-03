const router = require("express").Router();

router.get("/test", (req, res) => {
  res.json({ ok: true, route: "users" });
});

module.exports = router;
